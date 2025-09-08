# ScreenWatcher 安装指南

## 系统要求
- **操作系统**: macOS 10.15 (Catalina) 或更高版本
- **处理器**: Intel x64 或 Apple Silicon (M1/M2/M3)
- **存储空间**: 至少 200MB 可用空间
- **内存**: 建议 4GB 或更多

## 下载应用

### 1. 官方下载渠道
访问 [ScreenWatcher 官方网站](https://screenwatcher.app/download) 或 [GitHub Releases](https://github.com/your-username/screen-watcher/releases) 页面下载适合您系统的版本。

### 2. 选择正确的版本
根据您的 Mac 处理器类型选择对应版本：

- **Intel 处理器 (2020年前的Mac)**：下载 `ScreenWatcher-x.x.x-x64.dmg`
- **Apple Silicon (M1/M2/M3)**：下载 `ScreenWatcher-x.x.x-arm64.dmg`
- **不确定处理器类型**：下载通用版本 `ScreenWatcher-x.x.x-universal.dmg`

> **如何查看处理器类型**：点击苹果菜单 >  关于本机，查看"处理器"或"芯片"信息。

## 安装步骤

### 1. 下载并挂载安装包
1. 下载完成后，在下载文件夹中找到 `.dmg` 文件
2. 双击 `.dmg` 文件以挂载安装盘映像
3. 安装窗口将自动打开

### 2. 安装应用程序
1. 在打开的安装窗口中，将 **ScreenWatcher** 图标拖拽到 **Applications** 文件夹
2. 等待复制完成（通常需要几秒钟）
3. 复制完成后，右键点击桌面上的安装盘图标，选择"推出"

### 3. 验证安装
1. 打开 **Finder**，进入 **应用程序** 文件夹
2. 找到 **ScreenWatcher** 应用
3. 应用图标应显示为 ScreenWatcher 的标志

## 首次启动

### 1. 启动应用
1. 在应用程序文件夹中，双击 **ScreenWatcher**
2. 如果看到"无法打开，因为无法验证开发者"的警告：
   - 右键点击应用，选择 **打开**
   - 在弹出的对话框中点击 **打开**
   - 或者前往 **系统偏好设置** > **安全性与隐私** > **通用**，点击 **仍要打开**

### 2. 首次运行设置
应用首次启动时会进行初始化设置：

1. **欢迎界面**：了解 ScreenWatcher 的基本功能
2. **权限说明**：查看所需的系统权限列表
3. **隐私协议**：阅读并同意隐私政策

## 权限设置

ScreenWatcher 需要以下系统权限才能正常工作：

### 1. 屏幕录制权限 (必需)
这是应用的核心功能权限：

1. 首次启动时，系统会弹出权限请求对话框
2. 点击 **打开系统偏好设置**
3. 在 **安全性与隐私** > **隐私** > **屏幕录制** 中找到 ScreenWatcher
4. 勾选 ScreenWatcher 旁边的复选框
5. 如果 ScreenWatcher 未出现在列表中：
   - 点击 **+** 按钮
   - 导航到 **应用程序** 文件夹
   - 选择 **ScreenWatcher** 并点击 **打开**
6. **重启 ScreenWatcher** 使权限生效

### 2. 辅助功能权限 (推荐)
提供更好的系统集成体验：

1. 前往 **系统偏好设置** > **安全性与隐私** > **隐私** > **辅助功能**
2. 点击左下角的 **锁图标** 并输入管理员密码
3. 勾选 **ScreenWatcher**
4. 重新锁定设置

### 3. 文件和文件夹权限 (可选)
允许保存截图和数据：

1. 在首次尝试保存文件时，系统会请求权限
2. 点击 **授权** 允许访问
3. 或在 **系统偏好设置** > **安全性与隐私** > **隐私** > **文件和文件夹** 中手动设置

## 验证安装成功

### 1. 检查应用状态
启动 ScreenWatcher 后，确认以下项目：

- [ ] 应用成功启动，没有权限错误
- [ ] 菜单栏显示 ScreenWatcher 图标
- [ ] 主窗口正常显示
- [ ] 可以访问设置页面

### 2. 测试核心功能
1. **屏幕监控**：在设置中启用监控，检查是否能正常工作
2. **截图功能**：尝试手动截图，确认图像正常保存
3. **数据分析**：查看分析结果是否正确显示

## 常见问题解答

### Q: 应用无法打开，提示"已损坏"
**A**: 这通常是由于 Gatekeeper 安全检查导致的，解决方法：
```bash
# 在终端中运行（替换实际的应用路径）
sudo xattr -rd com.apple.quarantine /Applications/ScreenWatcher.app
```

### Q: 无法获取屏幕录制权限
**A**: 完整的权限设置步骤：
1. 完全退出 ScreenWatcher（包括菜单栏图标）
2. 前往 **系统偏好设置** > **安全性与隐私** > **隐私** > **屏幕录制**
3. 如果列表中有 ScreenWatcher，先取消勾选，然后重新勾选
4. 如果没有，点击 **+** 手动添加
5. 重启 ScreenWatcher

### Q: 应用运行缓慢或占用内存过高
**A**: 优化建议：
1. 在设置中降低监控频率
2. 启用"节能模式"
3. 定期清理历史数据
4. 关闭不需要的功能模块

### Q: 更新后应用无法启动
**A**: 尝试以下方法：
1. 重启 Mac
2. 重新设置屏幕录制权限
3. 如果问题持续，完全卸载后重新安装

### Q: 如何备份应用数据
**A**: 应用数据保存在以下位置：
```
~/Library/Application Support/ScreenWatcher/
~/Library/Preferences/com.screenwatcher.app.plist
```

## 卸载应用

如果需要完全卸载 ScreenWatcher：

### 1. 退出应用
1. 右键点击菜单栏中的 ScreenWatcher 图标
2. 选择 **退出 ScreenWatcher**
3. 确认所有 ScreenWatcher 进程已关闭

### 2. 删除应用程序
1. 打开 **Finder** > **应用程序**
2. 找到 **ScreenWatcher**
3. 将其拖拽到 **废纸篓** 或右键选择 **移到废纸篓**

### 3. 清理相关文件 (可选)
如果要完全清理所有数据，在终端中执行：

```bash
# 删除应用数据
rm -rf ~/Library/Application\ Support/ScreenWatcher

# 删除偏好设置
rm -f ~/Library/Preferences/com.screenwatcher.app.plist

# 删除日志文件
rm -rf ~/Library/Logs/ScreenWatcher

# 删除缓存数据
rm -rf ~/Library/Caches/com.screenwatcher.app
```

### 4. 移除系统权限 (可选)
1. **系统偏好设置** > **安全性与隐私** > **隐私**
2. 在 **屏幕录制** 和 **辅助功能** 中取消勾选 ScreenWatcher
3. 点击 **-** 按钮将其从列表中删除

## 技术支持

如果您在安装或使用过程中遇到问题：

### 联系方式
- **官方网站**: https://screenwatcher.app
- **GitHub Issues**: https://github.com/your-username/screen-watcher/issues
- **邮箱支持**: support@screenwatcher.app

### 报告问题时请提供
1. macOS 版本和处理器类型
2. ScreenWatcher 版本号
3. 详细的错误描述或截图
4. 重现问题的步骤

### 获取版本信息
在 ScreenWatcher 中：菜单栏图标 > 关于 ScreenWatcher

### 获取日志文件
日志文件位置：`~/Library/Logs/ScreenWatcher/main.log`

---

感谢您选择 ScreenWatcher！如有任何疑问，随时联系我们的技术支持团队。