const variants = {
  development: { name: 'meide', id: 'app.meide.preview', scheme: 'meide-dev' },
  preview: { name: 'Meide 테스트', id: 'com.meide.mobile.preview', scheme: 'meide-preview' },
  production: { name: 'meide', id: 'com.meide.travelguide', scheme: 'meide' },
};

module.exports = ({ config }) => {
  const variant = process.env.APP_VARIANT || 'development';
  const selected = variants[variant];
  if (!selected) throw new Error(`Unknown APP_VARIANT: ${variant}`);
  // Client map keys must be separately restricted to app package/signature or
  // bundle identifier. Never reuse GOOGLE_MENU_API_KEY or GOOGLE_MAPS_API_KEY.
  const androidMapKey=process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  const iosMapKey=process.env.GOOGLE_MAPS_IOS_API_KEY?.trim();

  // Installed test/release apps must not silently use the developer's localhost.
  if (variant !== 'development') {
    if(process.env.EAS_BUILD_PLATFORM==='android'&&!androidMapKey)throw new Error('Set GOOGLE_MAPS_ANDROID_API_KEY with Android package and SHA-1 restrictions before building.');
    for (const key of ['EXPO_PUBLIC_COMPANION_API_URL', 'EXPO_PUBLIC_INVITE_WEB_URL']) {
      let url;
      try { url = new URL(process.env[key]); } catch { /* Report the setting, never its value. */ }
      if (!url || url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
          url.pathname !== '/' || url.hostname === 'localhost' || url.hostname.endsWith('.localhost') ||
          url.hostname.endsWith('.local') || url.hostname === '[::1]' || /^127\./.test(url.hostname) ||
          /^10\./.test(url.hostname) || /^192\.168\./.test(url.hostname) ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname)) {
        throw new Error(`${key}: set a public HTTPS origin before building ${variant}.`);
      }
    }
  }

  return {
    ...config,
    name: selected.name,
    scheme: selected.scheme,
    ios: { ...config.ios, bundleIdentifier: selected.id },
    android: { ...config.android, package: selected.id, ...(variant === 'production' ? { versionCode: 6 } : {}) },
    plugins:[...(config.plugins??[]),['expo-build-properties',{android:{enableMinifyInReleaseBuilds:false,enableShrinkResourcesInReleaseBuilds:false}}],['react-native-maps',{androidGoogleMapsApiKey:androidMapKey,iosGoogleMapsApiKey:iosMapKey}]],
    extra: { ...config.extra, appVariant: variant, googleMapsAndroidConfigured:!!androidMapKey,googleMapsIosConfigured:!!iosMapKey },
  };
};
