export interface SamplePhoto {
  src: string
  thumbnail: string
  title: string
}

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    src: 'https://picsum.photos/id/1015/1200/800',
    thumbnail: 'https://picsum.photos/id/1015/320/213',
    title: '峡湾观景台'
  },
  {
    src: 'https://picsum.photos/id/1018/1200/800',
    thumbnail: 'https://picsum.photos/id/1018/320/213',
    title: '高地公路'
  },
  {
    src: 'https://picsum.photos/id/1039/1200/800',
    thumbnail: 'https://picsum.photos/id/1039/320/213',
    title: '森林瀑布'
  },
  {
    src: 'https://picsum.photos/id/1043/1200/800',
    thumbnail: 'https://picsum.photos/id/1043/320/213',
    title: '山谷溪流'
  }
]

export const SAMPLE_IMAGE_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs><rect width="240" height="160" fill="url(#g)"/><text x="120" y="88" font-family="sans-serif" font-size="16" fill="white" text-anchor="middle">preview</text></svg>'
)}`

// 头像示例用真人照片，图片放在 examples/consumer/public/avatars 下，断网也能加载
export const SAMPLE_AVATAR_A = '/avatars/avatar-1.png'
export const SAMPLE_AVATAR_B = '/avatars/avatar-2.png'
export const SAMPLE_AVATAR_C = '/avatars/avatar-3.png'

export const SAMPLE_AVATAR_LIST: readonly string[] = Object.freeze([SAMPLE_AVATAR_A, SAMPLE_AVATAR_B, SAMPLE_AVATAR_C])

// 横向照片：塞进方形头像时 cover 裁掉两侧、contain 留出上下空白，用于观察 fit 差异
export const SAMPLE_AVATAR_WIDE = '/avatars/scene-landscape.png'
