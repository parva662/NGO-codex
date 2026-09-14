package ir.haghyar.offline;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.lang.reflect.Field;

public class MainActivityV13 extends MainActivity {
  private WebView patchedWebView;

  @Override public void onCreate(Bundle b) {
    super.onCreate(b);
    try {
      Field f = MainActivity.class.getDeclaredField("webView");
      f.setAccessible(true);
      patchedWebView = (WebView) f.get(this);
      patchedWebView.setWebViewClient(new WebViewClient(){
        @Override public void onPageFinished(WebView view, String url) {
          super.onPageFinished(view,url);
          if(url!=null && url.endsWith("v1_1.html")) {
            try {
              view.evaluateJavascript(readLocalAsset("v1_2_patch.js"), value -> {
                try { view.evaluateJavascript(readLocalAsset("v1_3_patch.js"), null); }
                catch(Exception e){ Toast.makeText(MainActivityV13.this,"خطا در بارگذاری موتور QA 1.3",Toast.LENGTH_LONG).show(); }
              });
            } catch(Exception e) {
              Toast.makeText(MainActivityV13.this,"خطا در بارگذاری به‌روزرسانی حق‌یار",Toast.LENGTH_LONG).show();
            }
          }
        }
      });
    } catch(Exception e) {
      Toast.makeText(this,"خطا در راه‌اندازی نسخه 1.3",Toast.LENGTH_LONG).show();
    }
  }

  private String readLocalAsset(String name) throws Exception {
    try(InputStream is=getAssets().open(name); ByteArrayOutputStream os=new ByteArrayOutputStream()) {
      byte[] b=new byte[8192]; int n; while((n=is.read(b))>0) os.write(b,0,n); return os.toString("UTF-8");
    }
  }
}
