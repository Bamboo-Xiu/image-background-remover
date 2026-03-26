// 定价配置

export const SUBSCRIPTION_PLANS = {
  light: {
    name: '轻量版',
    price: 1990,        // 分
    priceYuan: 19.9,    // 元
    quota: 50,
    unitPrice: 0.40,    // 元/次
    features: [
      '每月 50 次处理',
      '基础分辨率输出',
      '历史记录保存',
    ],
  },
  standard: {
    name: '标准版',
    price: 4990,
    priceYuan: 49.9,
    quota: 200,
    unitPrice: 0.25,
    features: [
      '每月 200 次处理',
      '高清分辨率输出',
      '历史记录保存',
      '优先处理队列',
    ],
  },
  professional: {
    name: '专业版',
    price: 9990,
    priceYuan: 99.9,
    quota: 500,
    unitPrice: 0.20,
    features: [
      '每月 500 次处理',
      '高清分辨率输出',
      '批量处理功能',
      '优先处理队列',
      '专属客服支持',
    ],
  },
} as const

export const PAY_PER_USE_OPTIONS = {
  small: {
    name: '20次卡',
    price: 990,
    priceYuan: 9.9,
    quota: 20,
    unitPrice: 0.50,
  },
  medium: {
    name: '50次卡',
    price: 1990,
    priceYuan: 19.9,
    quota: 50,
    unitPrice: 0.40,
  },
  large: {
    name: '100次卡',
    price: 2990,
    priceYuan: 29.9,
    quota: 100,
    unitPrice: 0.30,
  },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PLANS
export type PayPerUseOption = keyof typeof PAY_PER_USE_OPTIONS

// 免费配额
export const FREE_QUOTA = 5

// 订阅时长（天）
export const SUBSCRIPTION_DURATION_DAYS = 30
