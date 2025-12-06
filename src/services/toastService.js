import { toast } from 'react-hot-toast';

class ToastService {
  constructor() {
    this.toastQueue = [];
    this.isProcessing = false;
    this.processDelay = 2000; // 2 seconds between toasts
  }

  // Add toast to queue
  queueToast(type, message, options = {}) {
    this.toastQueue.push({ type, message, options });
    this.processQueue();
  }

  // Process toast queue sequentially
  async processQueue() {
    if (this.isProcessing || this.toastQueue.length === 0) return;

    this.isProcessing = true;

    while (this.toastQueue.length > 0) {
      const { type, message, options } = this.toastQueue.shift();

      // Show toast based on type
      switch (type) {
        case 'success':
          toast.success(message, {
            duration: 3000,
            position: 'top-right',
            ...options
          });
          break;
        case 'error':
          toast.error(message, {
            duration: 4000,
            position: 'top-right',
            ...options
          });
          break;
        case 'online':
          toast.success(message, {
            duration: 3000,
            position: 'top-right',
            icon: '🟢',
            style: {
              background: '#10B981',
              color: '#fff',
            },
            ...options
          });
          break;
        case 'offline':
          toast(message, {
            duration: 3000,
            position: 'top-right',
            icon: '🔴',
            style: {
              background: '#6B7280',
              color: '#fff',
            },
            ...options
          });
          break;
        default:
          toast(message, {
            duration: 3000,
            position: 'top-right',
            ...options
          });
      }

      // Wait before processing next toast
      if (this.toastQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.processDelay));
      }
    }

    this.isProcessing = false;
  }

  // Show member online toast (DISABLED - using OnlineMembersIndicator instead)
  showMemberOnline(memberName, clubName) {
    // Disabled - using visual indicator instead
    // this.queueToast('online', `${memberName} is now online in ${clubName}`, {
    //   id: `online-${memberName}`,
    // });
  }

  // Show member offline toast (disabled - only show online notifications)
  showMemberOffline(memberName, clubName) {
    // Disabled - only show online notifications as per user request
    // this.queueToast('offline', `${memberName} went offline in ${clubName}`, {
    //   id: `offline-${memberName}`,
    // });
  }

  // Show bulk online notifications (DISABLED - using OnlineMembersIndicator instead)
  showBulkOnlineNotifications(onlineMembers, clubName) {
    // Disabled - using visual indicator instead
    // Limit to first 5 members to avoid spam
    // const membersToShow = onlineMembers.slice(0, 5);

    // membersToShow.forEach((member, index) => {
    //   setTimeout(() => {
    //     this.queueToast('online', `${member.displayName} is online in ${clubName}`, {
    //       id: `bulk-online-${member.userId}`,
    //     });
    //   }, index * 1000); // Stagger by 1 second each
    // });

    // If there are more than 5, show a summary toast
    // if (onlineMembers.length > 5) {
    //   setTimeout(() => {
    //     this.queueToast('success', `+${onlineMembers.length - 5} more members are online in ${clubName}`, {
    //       id: `bulk-online-summary`,
    //     });
    //   }, 5000);
    // }
  }

  // Clear all queued toasts
  clearQueue() {
    this.toastQueue = [];
    this.isProcessing = false;
  }

  // Set processing delay
  setProcessDelay(delay) {
    this.processDelay = delay;
  }
}

// Export singleton instance
export const toastService = new ToastService();
export default toastService;
