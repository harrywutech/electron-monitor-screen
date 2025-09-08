const { notarize } = require('@electron/notarize');
const path = require('path');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  if (electronPlatformName !== 'darwin') {
    console.log('跳过公证，仅支持 macOS 平台');
    return;
  }

  // 检查必要的环境变量
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.warn('警告：缺少公证所需的环境变量，跳过公证步骤');
    console.warn('需要设置：APPLE_ID, APPLE_ID_PASSWORD, APPLE_TEAM_ID');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`开始公证 ${appName}.app...`);
  console.log(`应用路径: ${appPath}`);

  try {
    await notarize({
      tool: 'notarytool',
      appBundleId: 'com.screenwatcher.app',
      appPath: appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });

    console.log(`✅ ${appName}.app 公证完成`);
  } catch (error) {
    console.error('❌ 公证失败:', error);
    
    // 如果是开发环境，不要因为公证失败而中止构建
    if (process.env.NODE_ENV === 'development') {
      console.log('开发环境：继续构建，忽略公证错误');
      return;
    }
    
    throw error;
  }
};