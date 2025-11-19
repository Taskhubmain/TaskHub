// Smooth navigation helper
export const navigate = (path: string) => {
  window.location.hash = path;
};

export const navigateToProfile = (userId: string, currentUserId: string | undefined) => {
  if (!userId) return;

  if (userId === currentUserId) {
    navigate('/profile');
  } else {
    navigate(`/users/${userId}`);
  }
};

export const navigateToOrder = (orderId: string) => {
  navigate(`/order/${orderId}`);
};

export const navigateToTask = (taskId: string) => {
  navigate(`/task/${taskId}`);
};

export const navigateToDeal = (dealId: string) => {
  navigate(`/deal/${dealId}`);
};

export const navigateToMessages = (chatId?: string) => {
  navigate(chatId ? `/messages/${chatId}` : '/messages');
};

export const navigateToMarket = (type?: 'orders' | 'tasks') => {
  navigate(type ? `/market?type=${type}` : '/market');
};
