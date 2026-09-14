package ir.haghyar.offline;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import android.content.Intent;
import android.net.Uri;
import android.graphics.pdf.PdfDocument;
import android.graphics.Canvas;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextDirectionHeuristics;
import android.text.TextPaint;
import android.graphics.Typeface;
import android.database.Cursor;
import android.provider.OpenableColumns;
import androidx.core.content.FileProvider;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
  private WebView webView;
  private static final int PICK_FILE_REQUEST = 4105;
  private String pendingQuestionId = "";

  @Override public void onCreate(Bundle b) {
    super.onCreate(b);
    webView = new WebView(this);
    setContentView(webView);
    WebSettings s = webView.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setAllowFileAccess(true);
    webView.addJavascriptInterface(new Bridge(), "Android");
    webView.loadUrl("file:///android_asset/v5.html");
  }

  @Override public void onBackPressed() {
    if (webView.canGoBack()) webView.goBack(); else super.onBackPressed();
  }

  private void shareFile(File f, String mime) {
    Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".files", f);
    Intent in = new Intent(Intent.ACTION_SEND);
    in.setType(mime);
    in.putExtra(Intent.EXTRA_STREAM, uri);
    in.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    startActivity(Intent.createChooser(in, "ارسال فایل پرونده"));
  }

  private String safeName(String name) {
    if (name == null || name.trim().isEmpty()) return "attachment-" + System.currentTimeMillis();
    return name.replaceAll("[\\\\/:*?\"<>|]", "_");
  }

  @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    if (requestCode != PICK_FILE_REQUEST || resultCode != RESULT_OK || data == null || data.getData() == null) return;
    Uri uri = data.getData();
    try {
      String name = "attachment-" + System.currentTimeMillis();
      long size = 0;
      Cursor c = getContentResolver().query(uri, null, null, null, null);
      if (c != null) {
        int ni = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
        int si = c.getColumnIndex(OpenableColumns.SIZE);
        if (c.moveToFirst()) {
          if (ni >= 0 && c.getString(ni) != null) name = c.getString(ni);
          if (si >= 0 && !c.isNull(si)) size = c.getLong(si);
        }
        c.close();
      }
      String mime = getContentResolver().getType(uri);
      if (mime == null) mime = "application/octet-stream";
      File dir = new File(getExternalFilesDir(null), "attachments");
      dir.mkdirs();
      File out = new File(dir, System.currentTimeMillis() + "-" + safeName(name));
      try (InputStream is = getContentResolver().openInputStream(uri); FileOutputStream os = new FileOutputStream(out)) {
        if (is != null) {
          byte[] buf = new byte[8192]; int n;
          while ((n = is.read(buf)) > 0) os.write(buf, 0, n);
        }
      }
      String js = "window.onHaghyarFilePicked(" + JSONObject.quote(pendingQuestionId) + "," + JSONObject.quote(name) + "," + JSONObject.quote(mime) + "," + size + "," + JSONObject.quote(out.getAbsolutePath()) + ")";
      webView.evaluateJavascript(js, null);
      Toast.makeText(this, "مدرک به پرونده اضافه شد", Toast.LENGTH_SHORT).show();
    } catch (Exception e) {
      Toast.makeText(this, "خطا در افزودن مدرک", Toast.LENGTH_LONG).show();
    }
  }

  public class Bridge {
    @JavascriptInterface public void pickFile(String questionId) {
      pendingQuestionId = questionId == null ? "" : questionId;
      Intent in = new Intent(Intent.ACTION_OPEN_DOCUMENT);
      in.addCategory(Intent.CATEGORY_OPENABLE);
      in.setType("*/*");
      startActivityForResult(in, PICK_FILE_REQUEST);
    }

    @JavascriptInterface public void saveFile(String name, String content, String mime) {
      try {
        File dir = new File(getExternalFilesDir(null), "exports"); dir.mkdirs();
        File f = new File(dir, name);
        try (FileOutputStream os = new FileOutputStream(f)) { os.write(content.getBytes(StandardCharsets.UTF_8)); }
        shareFile(f, mime);
      } catch (Exception e) { Toast.makeText(MainActivity.this, "خطا در ساخت فایل", Toast.LENGTH_LONG).show(); }
    }

    @JavascriptInterface public void savePdf(String name, String content) {
      try {
        File dir = new File(getExternalFilesDir(null), "exports"); dir.mkdirs();
        File f = new File(dir, name);
        final int w=595,h=842,m=44,cw=w-m*2,ch=h-m*2;
        TextPaint paint=new TextPaint(TextPaint.ANTI_ALIAS_FLAG);
        paint.setColor(android.graphics.Color.rgb(25,31,42));
        paint.setTextSize(12.5f);
        paint.setTypeface(Typeface.create(Typeface.DEFAULT,Typeface.NORMAL));
        PdfDocument pdf=new PdfDocument(); String rem=content==null?"":content; int pn=1;
        while(!rem.isEmpty()) {
          StaticLayout full=StaticLayout.Builder.obtain(rem,0,rem.length(),paint,cw).setAlignment(Layout.Alignment.ALIGN_NORMAL).setTextDirection(TextDirectionHeuristics.FIRSTSTRONG_RTL).setLineSpacing(3.5f,1.12f).setIncludePad(true).build();
          int fit=full.getLineCount()-1;
          for(int i=0;i<full.getLineCount();i++){if(full.getLineBottom(i)>ch){fit=Math.max(0,i-1);break;}}
          int end=full.getLineEnd(fit); if(end<=0||end>rem.length())end=Math.min(rem.length(),1000);
          String pt=rem.substring(0,end).trim(); rem=rem.substring(end).trim();
          StaticLayout pl=StaticLayout.Builder.obtain(pt,0,pt.length(),paint,cw).setAlignment(Layout.Alignment.ALIGN_NORMAL).setTextDirection(TextDirectionHeuristics.FIRSTSTRONG_RTL).setLineSpacing(3.5f,1.12f).setIncludePad(true).build();
          PdfDocument.PageInfo info=new PdfDocument.PageInfo.Builder(w,h,pn).create(); PdfDocument.Page page=pdf.startPage(info); Canvas canvas=page.getCanvas(); canvas.save(); canvas.translate(m,m); pl.draw(canvas); canvas.restore(); pdf.finishPage(page); pn++;
        }
        if(pn==1){PdfDocument.PageInfo info=new PdfDocument.PageInfo.Builder(w,h,1).create();PdfDocument.Page page=pdf.startPage(info);pdf.finishPage(page);}
        try(FileOutputStream os=new FileOutputStream(f)){pdf.writeTo(os);} pdf.close(); shareFile(f,"application/pdf");
      } catch(Exception e){Toast.makeText(MainActivity.this,"خطا در ساخت PDF",Toast.LENGTH_LONG).show();}
    }
  }
}
