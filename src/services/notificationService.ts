export interface NotificationOptions {
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

class NotificationService {
  private container: any = null

  setContainer(container: any) {
    this.container = container
  }

  private show(options: NotificationOptions) {
    if (!this.container) {
      console.warn('Notification container not initialized')
      return
    }

    this.container.addNotification({
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration || 5000
    })
  }

  success(title: string, message: string, duration?: number) {
    this.show({ title, message, type: 'success', duration })
  }

  error(title: string, message: string, duration?: number) {
    this.show({ title, message, type: 'error', duration })
  }

  warning(title: string, message: string, duration?: number) {
    this.show({ title, message, type: 'warning', duration })
  }

  info(title: string, message: string, duration?: number) {
    this.show({ title, message, type: 'info', duration })
  }

  // Convenience methods for common notifications
  showSuccess(message: string, title = '成功') {
    this.success(title, message)
  }

  showError(message: string, title = '错误') {
    this.error(title, message)
  }

  showWarning(message: string, title = '警告') {
    this.warning(title, message)
  }

  showInfo(message: string, title = '信息') {
    this.info(title, message)
  }

  // LangChain specific notifications
  showConnectionSuccess() {
    this.success('连接成功', 'API密钥和端点配置正确，可以正常使用。')
  }

  showConnectionError(message: string) {
    this.error('连接失败', message)
  }

  showModelLoaded(count: number) {
    this.info('模型加载完成', `成功加载 ${count} 个可用模型。`)
  }

  showSettingsSaved() {
    this.success('设置已保存', '配置已保存到本地存储。')
  }

  showTestStarted() {
    this.info('开始测试', '正在测试连接配置...')
  }

  showTestCompleted(success: boolean, message: string) {
    if (success) {
      this.success('测试完成', message)
    } else {
      this.error('测试失败', message)
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService()

// Global interface for easy access
declare global {
  interface Window {
    $notify: typeof notificationService
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.$notify = notificationService
} 