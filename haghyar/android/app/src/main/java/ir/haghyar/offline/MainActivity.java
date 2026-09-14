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
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
  private WebView webView;

  @Override public void onCreate(Bundle b) {
    super.onCreate(b);
    webView = new WebView(this);
    setContentView(webView);
    WebSettings s = webView.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setAllowFileAccess(true);
    webView.addJavascriptInterface(new Bridge(), "Android");
    webView.loadUrl("file:///android_asset/index.html");
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

  public class Bridge {
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
        final int pageWidth=595,pageHeight=842,margin=44,contentWidth=pageWidth-margin*2,contentHeight=pageHeight-margin*2;
        TextPaint paint=new TextPaint(TextPaint.ANTI_ALIAS_FLAG);
        paint.setColor(android.graphics.Color.rgb(25,31,42)); paint.setTextSize(12.5f); paint.setTypeface(Typeface.create(Typeface.DEFAULT,Typeface.NORMAL));
        PdfDocument pdf=new PdfDocument(); String remaining=content==null?"":content; int pageNo=1;
        while(!remaining.isEmpty()) {
          StaticLayout full=StaticLayout.Builder.obtain(remaining,0,remaining.length(),paint,contentWidth).setAlignment(Layout.Alignment.ALIGN_NORMAL).setTextDirection(TextDirectionHeuristics.FIRSTSTRONG_RTL).setLineSpacing(3.5f,1.12f).setIncludePad(true).build();
          int fitLine=full.getLineCount()-1;
          for(int i=0;i<full.getLineCount();i++){if(full.getLineBottom(i)>contentHeight){fitLine=Math.max(0,i-1);break;}}
          int end=full.getLineEnd(fitLine); if(end<=0||end>remaining.length())end=Math.min(remaining.length(),1000);
          String pageText=remaining.substring(0,end).trim(); remaining=remaining.substring(end).trim();
          StaticLayout pageLayout=StaticLayout.Builder.obtain(pageText,0,pageText.length(),paint,contentWidth).setAlignment(Layout.Alignment.ALIGN_NORMAL).setTextDirection(TextDirectionHeuristics.FIRSTSTRONG_RTL).setLineSpacing(3.5f,1.12f).setIncludePad(true).build();
          PdfDocument.PageInfo info=new PdfDocument.PageInfo.Builder(pageWidth,pageHeight,pageNo).create(); PdfDocument.Page page=pdf.startPage(info); Canvas canvas=page.getCanvas(); canvas.save(); canvas.translate(margin,margin); pageLayout.draw(canvas); canvas.restore(); pdf.finishPage(page); pageNo++;
        }
        if(pageNo==1){PdfDocument.PageInfo info=new PdfDocument.PageInfo.Builder(pageWidth,pageHeight,1).create();PdfDocument.Page page=pdf.startPage(info);pdf.finishPage(page);}
        try(FileOutputStream os=new FileOutputStream(f)){pdf.writeTo(os);} pdf.close(); shareFile(f,"application/pdf");
      } catch(Exception e){Toast.makeText(MainActivity.this,"خطا در ساخت PDF",Toast.LENGTH_LONG).show();}
    }
  }
}
