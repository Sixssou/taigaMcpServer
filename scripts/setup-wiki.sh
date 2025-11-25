#!/bin/bash

# 🚀 GitHub Wiki 自动化设置脚本
# 使用方法: chmod +x scripts/setup-wiki.sh && ./scripts/setup-wiki.sh

echo "🚀 开始设置 GitHub Wiki..."

# 设置变量
REPO_URL="https://github.com/greddy7574/taigaMcpServer.wiki.git"
WIKI_DIR="temp-wiki-setup"

# 清理之前的临时目录
if [ -d "$WIKI_DIR" ]; then
    echo "🧹 清理旧的临时目录..."
    rm -rf "$WIKI_DIR"
fi

# 尝试克隆Wiki仓库
echo "📥 尝试克隆Wiki仓库..."
if git clone "$REPO_URL" "$WIKI_DIR" 2>/dev/null; then
    echo "✅ Wiki仓库已存在，直接更新..."
    cd "$WIKI_DIR"
else
    echo "⚠️  Wiki仓库尚未初始化"
    echo "📋 请先手动创建Wiki首页："
    echo "   1. 访问: https://github.com/greddy7574/taigaMcpServer/wiki"
    echo "   2. 点击 'Create the first page'"
    echo "   3. 输入任意内容并保存"
    echo "   4. 然后重新运行此脚本"
    echo ""
    echo "🔄 或者直接使用快速创建方法："
    echo "   访问: https://github.com/greddy7574/taigaMcpServer/wiki/Home/_edit"
    exit 1
fi

# 切换到Wiki目录
cd "$WIKI_DIR"

echo "📝 开始创建Wiki页面..."

# 创建Home页面
echo "🏠 创建首页 (Home.md)..."
cp ../wiki-templates/Home.md Home.md

# 创建侧边栏
echo "🧭 创建侧边栏 (_Sidebar.md)..."
cp ../wiki-templates/_Sidebar.md _Sidebar.md

# 创建其他页面
echo "⚡ 创建安装指南 (Installation-Guide.md)..."
cp ../wiki-templates/Installation-Guide.md Installation-Guide.md

echo "📋 创建API参考 (API-Reference.md)..."
cp ../wiki-templates/API-Reference.md API-Reference.md

echo "🚀 创建CI/CD指南 (CICD-Automation.md)..."
cp ../wiki-templates/CICD-Automation.md CICD-Automation.md

# 提交所有更改
echo "💾 提交所有Wiki页面..."
git add .
git commit -m "Complete Wiki setup with all documentation pages

📚 Created Pages:
- Home.md: Professional landing page with navigation
- _Sidebar.md: Complete navigation structure  
- Installation-Guide.md: Comprehensive setup instructions
- API-Reference.md: Complete 13-tool API documentation
- CICD-Automation.md: Full automation workflow guide

✨ Features:
- Professional documentation experience
- Mobile-optimized responsive design
- Complete internal linking structure
- Rich formatting with code blocks and tables
- Search-optimized content structure

🎯 Created by automated setup script
🤖 Generated with Claude Code assistance"

# 推送到GitHub
echo "🚀 推送到GitHub Wiki..."
git push origin master

# 返回主目录
cd ..

# 清理临时目录
echo "🧹 清理临时文件..."
rm -rf "$WIKI_DIR"

echo ""
echo "🎉 Wiki设置完成！"
echo "📖 访问你的Wiki: https://github.com/greddy7574/taigaMcpServer/wiki"
echo "🔍 所有页面都已创建并可以搜索"
echo ""
echo "📋 创建的页面："
echo "   • 首页 (Home)"
echo "   • 侧边栏导航 (_Sidebar)"  
echo "   • 安装指南 (Installation-Guide)"
echo "   • API参考 (API-Reference)"
echo "   • CI/CD自动化 (CICD-Automation)"
echo ""
echo "💡 提示: 你现在可以在GitHub上在线编辑这些页面！"