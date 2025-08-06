# Inner Compass AI - 个人成长助手

基于AI的个人成长记录与计划推荐系统，帮助用户建立持续的成长习惯，实现螺旋式上升的人生。

## 功能特色

### 📝 多维度记录
- 情绪评分 (1-10分)
- 精力水平 (1-10分)
- 生产力评分 (1-10分)
- 每日成就记录
- 挑战和困难追踪
- 感恩记录
- 每日反思
- 目标完成情况

### 🤖 AI智能分析
- 集成DeepSeek-R1模型
- 自动分析行为模式
- 生成个性化洞察
- 提供改进建议
- 智能计划推荐

### 🎯 成瘾机制设计
- 积分系统：每次记录获得积分
- 等级系统：基于积分自动升级
- 连续天数追踪：激励持续记录
- 成就解锁：多种成就等待解锁
- 进度可视化：直观显示成长轨迹

### 📊 数据可视化
- 成长趋势图表
- 统计数据面板
- 历史记录查看
- 成就展示

## 技术栈

- **前端**: Next.js 15 + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **AI服务**: DeepSeek-R1 API
- **部署**: Vercel

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd inner-compass-ai
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制 `.env.example` 为 `.env.local` 并填入配置信息：

```bash
cp .env.example .env.local
```

配置以下环境变量：

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# DeepSeek API配置
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_BASE_URL=https://api.deepseek.com

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 数据库设置

1. 在Supabase中创建新项目
2. 执行 `supabase/migrations/001_initial_schema.sql` 中的SQL语句
3. 启用Row Level Security (RLS)

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 部署到Vercel

1. 将代码推送到GitHub仓库
2. 在Vercel中连接GitHub仓库
3. 配置环境变量
4. 部署项目

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   ├── dashboard/         # 仪表板页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx          # 首页
├── components/            # React组件
│   ├── ai/               # AI相关组件
│   ├── auth/             # 认证组件
│   ├── daily/            # 每日记录组件
│   ├── gamification/     # 游戏化组件
│   └── ui/               # UI基础组件
├── contexts/             # React Context
├── lib/                  # 工具库
│   ├── services/         # 业务服务
│   ├── deepseek.ts      # DeepSeek API集成
│   ├── supabase.ts      # Supabase配置
│   └── utils.ts         # 工具函数
└── types/               # TypeScript类型定义
```

## 核心功能模块

### 1. 用户认证系统
- 基于Supabase Auth
- 邮箱密码登录/注册
- 自动用户资料创建
- Row Level Security保护

### 2. 每日记录系统
- 多维度评分记录
- 成就和挑战追踪
- 感恩和反思记录
- 自动保存和编辑

### 3. AI分析引擎
- DeepSeek-R1集成
- 行为模式识别
- 个性化洞察生成
- 智能计划推荐

### 4. 游戏化系统
- 积分计算算法
- 成就解锁机制
- 等级进阶系统
- 连续天数追踪

## API接口

### POST /api/ai/analyze
触发AI分析用户数据，生成洞察和建议。

### POST /api/ai/plan
基于用户数据生成个性化计划。

## 数据库设计

### 主要表结构：
- `profiles`: 用户资料
- `daily_records`: 每日记录
- `goals`: 目标管理
- `ai_insights`: AI洞察

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 许可证

本项目采用MIT许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交Issue
- 发送邮件到项目维护者

---

**Inner Compass AI** - 让每一天都成为成长的记录 🌱