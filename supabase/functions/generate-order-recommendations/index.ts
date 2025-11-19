import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const hasSubscription = await supabase.rpc("has_active_recommendations_subscription", {
      p_user_id: user.id,
    });

    if (!hasSubscription.data) {
      return new Response(
        JSON.stringify({ error: "No active subscription" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: openOrders } = await supabase
      .from("orders")
      .select("id, title, description, price_min, price_max, tags, category, subcategory, created_at, user_id")
      .eq("status", "open")
      .neq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    console.log("Found open orders:", openOrders?.length || 0);

    if (!openOrders || openOrders.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], count: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: userDeals } = await supabase
      .from("deals")
      .select("final_amount, created_at, updated_at")
      .eq("freelancer_id", user.id)
      .eq("status", "completed");

    const avgAmount = userDeals && userDeals.length > 0
      ? userDeals.reduce((sum, deal) => sum + (deal.final_amount || 0), 0) / userDeals.length
      : profile.hourly_rate || 0;

    const totalDeals = userDeals?.length || 0;
    const avgRating = profile.rating || 0;

    const specialty = (profile.specialty || profile.category || "").toLowerCase();
    const skills = Array.isArray(profile.skills) ? profile.skills.map((s: string) => s.toLowerCase()) : [];

    console.log("User profile:", { specialty, skills, avgAmount, totalDeals, avgRating });

    const categoryKeywords: Record<string, string[]> = {
      "unity": ["unity", "юнити", "игр", "game", "геймдев", "gamedev", "3d", "vr", "ar", "шутер", "мобильн"],
      "c#": ["c#", "csharp", "си шарп", "unity", ".net", "asp"],
      "c++": ["c++", "cpp", "си плюс", "unreal"],
      "godot": ["godot", "игр", "game", "2d", "платформер"],
      "дизайн": ["дизайн", "design", "ui", "ux", "figma", "photoshop", "иллюстрац", "логотип", "брендинг", "ландшафт", "интерьер"],
      "веб": ["веб", "web", "сайт", "лендинг", "landing", "react", "vue", "angular", "frontend", "backend"],
      "мобильн": ["мобильн", "mobile", "android", "ios", "flutter", "react native"],
      "разработк": ["разработк", "программирован", "backend", "frontend", "fullstack", "api", "сервер"],
      "маркетинг": ["маркетинг", "marketing", "smm", "seo", "реклам", "продвижени"],
      "копирайтинг": ["копирайтинг", "контент", "статьи", "тексты", "редактур"],
      "видео": ["видео", "монтаж", "editing", "after effects", "premiere"],
      "3d": ["3d", "моделирование", "blender", "maya", "cinema 4d", "рендер"],
      "игры": ["игр", "game", "геймдев", "gamedev", "unity", "unreal", "godot"],
      "программирование": ["программ", "код", "разработк", "develop"],
    };

    const findMatchingCategories = (text: string): string[] => {
      const textLower = text.toLowerCase();
      const matches: string[] = [];

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => textLower.includes(keyword))) {
          matches.push(category);
        }
      }

      return matches;
    };

    const userCategories = findMatchingCategories(specialty + " " + skills.join(" "));

    const recommendations = [];

    for (const order of openOrders) {
      let score = 0;
      const reasons = [];

      const orderTags = Array.isArray(order.tags) ? order.tags.join(" ") : "";
      const orderText = `${order.title} ${order.description || ""} ${orderTags}`;
      const orderCategories = findMatchingCategories(orderText);

      if (orderCategories.length > 0 && userCategories.length > 0) {
        const categoryMatches = orderCategories.filter(cat => userCategories.includes(cat));
        if (categoryMatches.length > 0) {
          score += 35;
          reasons.push({ type: "specialty", value: `Соответствует вашей специальности: ${categoryMatches.join(", ")}` });
        }
      }

      if (skills.length > 0) {
        const titleLower = order.title.toLowerCase();
        const descLower = (order.description || "").toLowerCase();
        const tagsLower = orderTags.toLowerCase();

        const matchingSkills = skills.filter((skill: string) =>
          titleLower.includes(skill) ||
          descLower.includes(skill) ||
          tagsLower.includes(skill)
        );

        if (matchingSkills.length > 0) {
          score += 25;
          reasons.push({ type: "skills", value: `Совпадают навыки: ${matchingSkills.join(", ")}` });
        }
      }

      const orderBudget = order.price_max || order.price_min || 0;
      if (orderBudget > 0 && avgAmount > 0) {
        const budgetDiff = Math.abs(orderBudget - avgAmount) / avgAmount;
        if (budgetDiff < 0.3) {
          score += 20;
          reasons.push({ type: "budget", value: "Бюджет соответствует вашей средней сумме работы" });
        } else if (budgetDiff < 0.5) {
          score += 10;
          reasons.push({ type: "budget", value: "Бюджет близок к вашей средней сумме" });
        }
      }

      if (totalDeals > 5) {
        score += 10;
        reasons.push({ type: "experience", value: `У вас ${totalDeals} завершенных сделок` });
      } else if (totalDeals > 2) {
        score += 5;
      }

      if (avgRating >= 4.5) {
        score += 10;
        reasons.push({ type: "rating", value: `Высокий рейтинг ${avgRating.toFixed(1)}` });
      } else if (avgRating >= 4.0) {
        score += 5;
      }

      if (score >= 30) {
        recommendations.push({
          user_id: user.id,
          order_id: order.id,
          match_score: Math.min(100, score),
          match_reasons: reasons,
          is_visible: true,
        });
      }
    }

    recommendations.sort((a, b) => b.match_score - a.match_score);
    const topRecommendations = recommendations.slice(0, 20);

    console.log("Generated recommendations:", topRecommendations.length);

    await supabase
      .from("order_recommendations")
      .delete()
      .eq("user_id", user.id);

    if (topRecommendations.length > 0) {
      await supabase
        .from("order_recommendations")
        .insert(topRecommendations);
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: topRecommendations.length,
        recommendations: topRecommendations,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
