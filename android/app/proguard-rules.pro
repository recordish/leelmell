# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# ---- Leelmell (release 빌드에서 R8 사용) ----
# 오류 기록에 줄 번호가 남도록 (원래 이름은 AAB 속 매핑 파일로 Play 가 되돌립니다)
-keepattributes SourceFile,LineNumberTable

# @capgo/capacitor-updater: 자기 규칙 파일이 있지만 앱에 자동으로 적용되지 않아 여기에 옮겨 둡니다
-keepattributes *Annotation*, Signature
-keep class ee.forgr.capacitor_updater.** { *; }
-keep class com.getcapacitor.Bridge {
    com.getcapacitor.MessageHandler msgHandler;
}
-keep class com.getcapacitor.MessageHandler { *; }
-keep class com.getcapacitor.PluginCall {
    <init>(com.getcapacitor.MessageHandler, java.lang.String, java.lang.String, java.lang.String, com.getcapacitor.JSObject);
}
-keep class * implements com.getcapacitor.PluginHandle {
    public void invoke(java.lang.String, com.getcapacitor.PluginCall);
}
# 업데이터가 이름으로 찾아 쓰는 WebView 기능
-keep class androidx.webkit.WebViewFeature { *; }
-keep class androidx.webkit.WebViewCompat { *; }

# 결제 플러그인 (@capgo/native-purchases). Play 결제 라이브러리는 자기 규칙을 함께 가지고 옵니다
-keep class ee.forgr.nativepurchases.** { *; }

# 이 앱의 액티비티
-keep class com.leelmell.app.** { *; }
