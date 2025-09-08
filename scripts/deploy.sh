#!/bin/bash
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 输出函数
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        error "$1 命令未找到，请先安装"
        exit 1
    fi
}

# 主函数
main() {
    info "🚀 开始部署 ScreenWatcher..."

    # 检查版本参数
    if [ -z "$1" ]; then
        error "请提供版本号"
        echo "使用方法: $0 <version> [options]"
        echo "示例: $0 1.0.0"
        echo "选项:"
        echo "  --draft    创建草稿发布"
        echo "  --skip-tests    跳过测试"
        echo "  --local-only    只本地构建，不推送"
        exit 1
    fi

    VERSION=$1
    DRAFT_MODE=false
    SKIP_TESTS=false
    LOCAL_ONLY=false

    # 解析选项
    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --draft)
                DRAFT_MODE=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --local-only)
                LOCAL_ONLY=true
                shift
                ;;
            *)
                warning "未知选项: $1"
                shift
                ;;
        esac
    done

    # 检查必需的命令
    check_command "node"
    check_command "npm"
    check_command "git"

    # 检查 Node.js 版本
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "需要 Node.js 18 或更高版本，当前版本: $(node --version)"
        exit 1
    fi

    # 检查工作区是否干净
    if [ "$LOCAL_ONLY" = false ]; then
        if ! git diff --quiet || ! git diff --cached --quiet; then
            error "工作区有未提交的更改，请先提交或存储"
            exit 1
        fi
    fi

    # 验证版本号格式
    if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$'; then
        error "版本号格式无效: $VERSION"
        echo "正确格式: 1.0.0 或 1.0.0-beta.1"
        exit 1
    fi

    info "版本号: $VERSION"
    info "草稿模式: $DRAFT_MODE"
    info "跳过测试: $SKIP_TESTS"
    info "仅本地构建: $LOCAL_ONLY"

    # 更新版本号
    info "📝 更新版本号到 $VERSION..."
    npm version $VERSION --no-git-tag-version
    success "版本号已更新"

    # 安装依赖
    info "📦 安装依赖..."
    npm ci
    success "依赖安装完成"

    # 运行测试
    if [ "$SKIP_TESTS" = false ]; then
        info "🔍 运行代码检查..."
        
        if ! npm run lint; then
            error "代码检查失败"
            exit 1
        fi
        
        if ! npm run type-check; then
            error "类型检查失败"
            exit 1
        fi
        
        success "所有检查通过"
    else
        warning "跳过测试阶段"
    fi

    # 构建应用
    info "🏗️  构建应用..."
    if ! npm run build; then
        error "构建失败"
        exit 1
    fi
    success "应用构建完成"

    # 打包应用
    info "📦 打包应用..."
    if [ "$DRAFT_MODE" = true ]; then
        DIST_COMMAND="npm run release:draft"
    else
        DIST_COMMAND="npm run dist:mac"
    fi

    if ! eval $DIST_COMMAND; then
        error "打包失败"
        exit 1
    fi
    success "应用打包完成"

    # 显示构建结果
    info "📋 构建结果:"
    if [ -d "dist" ]; then
        find dist -name "*.dmg" -o -name "*.zip" | while read file; do
            SIZE=$(du -h "$file" | cut -f1)
            echo "  📄 $(basename "$file") ($SIZE)"
        done
    fi

    # Git 操作（仅在非本地模式下）
    if [ "$LOCAL_ONLY" = false ]; then
        info "🏷️  创建 Git 标签..."
        
        # 提交版本更改
        git add package.json package-lock.json
        if git diff --cached --quiet; then
            info "没有版本文件需要提交"
        else
            git commit -m "chore: bump version to $VERSION

🔖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
        fi
        
        # 创建标签
        if git tag -a "v$VERSION" -m "Release v$VERSION

🔖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"; then
            success "Git 标签创建完成"
        else
            error "Git 标签创建失败"
            exit 1
        fi

        # 推送到远程
        info "⬆️  推送到远程仓库..."
        if git push origin main && git push origin "v$VERSION"; then
            success "推送完成"
        else
            error "推送失败"
            exit 1
        fi

        # 显示 GitHub Actions 链接
        REPO_URL=$(git config --get remote.origin.url | sed 's/\.git$//')
        if [[ "$REPO_URL" == *"github.com"* ]]; then
            REPO_PATH=$(echo "$REPO_URL" | sed 's/.*github\.com[:/]\(.*\)/\1/')
            success "🎉 部署完成！"
            echo ""
            info "📊 查看构建进度:"
            echo "   🔗 https://github.com/$REPO_PATH/actions"
            echo ""
            info "📦 发布页面:"
            echo "   🔗 https://github.com/$REPO_PATH/releases"
        fi
    else
        success "🎉 本地构建完成！"
        info "构建文件位于 dist/ 目录"
    fi
}

# 脚本入口
main "$@"