export interface SocialLink {
  label: string;
  href: string;
  handle: string;
}

export interface TimelineItem {
  period: string;
  role: string;
  organization: string;
  summary: string;
}

export interface FocusArea {
  title: string;
  description: string;
}

export const SITE = {
  title: 'niratk',
  description:
    'niratk portfolio and blog',
  author: 'niratk',
  role: '',
  location: '',
  url: 'https://niratk.github.io',
  lang: 'ja',
  tagline: '',
  intro:
    'というハンドルネームを使っています。', 
} as const;

export const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
] as const;

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'GitHub',
    href: 'https://github.com/niratk',
    handle: '@niratk',
  },
  {
    label: 'X',
    href: 'https://x.com/niratk_',
    handle: '@niratk_',
  },
  {
    label: 'AtCoder',
    href: 'https://atcoder.jp/users/N2R',
    handle: 'N2R',
  }
];

export const FOCUS_AREAS: FocusArea[] = [
  {
    title: 'CPU',
    description:
      '最近はCPU実験と戯れています。N-way superscalar OoOの次はマルチコア・マルチスレッドでしょうか。',
  },
];

export const ABOUT = {
  lead: 'RTLからソフトまで',
  paragraphs: [
    '最近はCPU実験と戯れています。',
  ],
  timeline: [
    {
      period: '2026 — Present',
      role: '理学部情報科学科',
      organization: '東京大学',
      summary:
        '2026年11月現在、CPU実験と戯れています。',
    },
    {
      period: '2024 — 2026',
      role: '教養学部理科一類',
      organization: '東京大学',
      summary:
        '進振りと格闘',
    },
  ] satisfies TimelineItem[],
};
