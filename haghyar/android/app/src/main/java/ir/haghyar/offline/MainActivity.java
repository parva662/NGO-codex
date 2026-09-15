package ir.haghyar.offline;

import android.app.Activity;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.graphics.pdf.PdfDocument;
import android.graphics.pdf.PdfRenderer;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.RectF;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextDirectionHeuristics;
import android.text.TextPaint;
import android.graphics.Typeface;
import android.database.Cursor;
import android.provider.OpenableColumns;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import androidx.core.content.FileProvider;
import org.json.JSONObject;
import org.json.JSONArray;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class MainActivity extends Activity {
  private WebView webView;
  private static final int PICK_FILE_REQUEST = 4105;
  private static final String KEY_ALIAS = "haghyar_local_key_v1";
  private static final String PREFS = "haghyar_secure_store";
  private String pendingQuestionId = "";

  @Override public void onCreate(Bundle b) {
    super.onCreate(b);
    webView = new WebView(this);
    webView.setBackgroundColor(Color.rgb(245,247,251));
    setContentView(webView);
    WebSettings s = webView.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setAllowFileAccess(true);
    s.setDefaultTextEncodingName("utf-8");
    webView.setWebViewClient(new WebViewClient(){
      @Override public void onPageFinished(WebView view,String url){
        super.onPageFinished(view,url);
        if(url!=null && url.endsWith("v1_1.html")){
          try{
            view.evaluateJavascript(readAsset("v1_2_patch.js"), value -> {
              try{
                view.evaluateJavascript(readAsset("v1_4_knowledge.js"), value2 -> {
                  try{ view.evaluateJavascript(readAsset("v1_6_ui_fix.js"), null); }
                  catch(Exception e){ Toast.makeText(MainActivity.this,"خطا در بارگذاری اصلاحات رابط",Toast.LENGTH_LONG).show(); }
                });
              }catch(Exception e){ Toast.makeText(MainActivity.this,"خطا در بارگذاری دانش آفلاین",Toast.LENGTH_LONG).show(); }
            });
          }catch(Exception e){Toast.makeText(MainActivity.this,"خطا در بارگذاری به‌روزرسانی رابط",Toast.LENGTH_LONG).show();}
        }
      }
    });
    webView.addJavascriptInterface(new Bridge(), "Android");
    webView.loadUrl("file:///android_asset/v1_1.html");
  }

  private String readAsset(String name)throws Exception{
    try(InputStream is=getAssets().open(name);ByteArrayOutputStream os=new ByteArrayOutputStream()){
      byte[] b=new byte[8192];int n;while((n=is.read(b))>0)os.write(b,0,n);return os.toString("UTF-8");
    }
  }

  @Override public void onBackPressed(){if(webView.canGoBack())webView.goBack();else super.onBackPressed();}

  private SecretKey getKey() throws Exception {
    KeyStore ks = KeyStore.getInstance("AndroidKeyStore"); ks.load(null);
    if (!ks.containsAlias(KEY_ALIAS)) {
      KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
      kg.init(new KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setKeySize(256).build());
      kg.generateKey();
    }
    return ((KeyStore.SecretKeyEntry)ks.getEntry(KEY_ALIAS, null)).getSecretKey();
  }

  private String encryptString(String plain) throws Exception {
    Cipher c=Cipher.getInstance("AES/GCM/NoPadding"); c.init(Cipher.ENCRYPT_MODE,getKey());
    byte[] iv=c.getIV(), enc=c.doFinal(plain.getBytes(StandardCharsets.UTF_8));
    return Base64.encodeToString(iv,Base64.NO_WRAP)+"."+Base64.encodeToString(enc,Base64.NO_WRAP);
  }
  private String decryptString(String packed) throws Exception {
    String[] p=packed.split("\\.",2); if(p.length!=2)return "";
    Cipher c=Cipher.getInstance("AES/GCM/NoPadding");
    c.init(Cipher.DECRYPT_MODE,getKey(),new GCMParameterSpec(128,Base64.decode(p[0],Base64.NO_WRAP)));
    return new String(c.doFinal(Base64.decode(p[1],Base64.NO_WRAP)),StandardCharsets.UTF_8);
  }
  private SharedPreferences prefs(){return getSharedPreferences(PREFS,MODE_PRIVATE);}
  private File attachmentDir(){File d=new File(getExternalFilesDir(null),"attachments");d.mkdirs();return d;}
  private File secureAttachmentDir(){File d=new File(getFilesDir(),"secure_attachments");d.mkdirs();return d;}
  private File exportsDir(){File d=new File(getExternalFilesDir(null),"exports");d.mkdirs();return d;}

  private void writeEncryptedFile(InputStream in, File out)throws Exception{
    Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,getKey());
    try(FileOutputStream fos=new FileOutputStream(out)){fos.write(c.getIV().length);fos.write(c.getIV());try(CipherOutputStream cos=new CipherOutputStream(fos,c)){byte[] b=new byte[8192];int n;while((n=in.read(b))>0)cos.write(b,0,n);}}
  }
  private InputStream openMaybeEncrypted(String path)throws Exception{
    File f=new File(path); if(path.contains("secure_attachments")){
      FileInputStream fis=new FileInputStream(f);int n=fis.read();byte[] iv=new byte[n];if(fis.read(iv)!=n)throw new IOException("bad encrypted file");
      Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,getKey(),new GCMParameterSpec(128,iv));return new CipherInputStream(fis,c);
    } return new FileInputStream(f);
  }
  private byte[] readAll(InputStream in)throws Exception{try(InputStream x=in;ByteArrayOutputStream os=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=x.read(b))>0)os.write(b,0,n);return os.toByteArray();}}

  private void shareFile(File f,String mime){Uri uri=FileProvider.getUriForFile(this,getPackageName()+".files",f);Intent i=new Intent(Intent.ACTION_SEND);i.setType(mime);i.putExtra(Intent.EXTRA_STREAM,uri);i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);startActivity(Intent.createChooser(i,"اشتراک‌گذاری"));}

  public class Bridge {
    @JavascriptInterface public void pickFile(String id){pendingQuestionId=id;Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("*/*");startActivityForResult(i,PICK_FILE_REQUEST);}
    @JavascriptInterface public void saveSecure(String key,String value){try{prefs().edit().putString(key,encryptString(value)).apply();}catch(Exception e){Toast.makeText(MainActivity.this,"خطا در ذخیره امن",Toast.LENGTH_SHORT).show();}}
    @JavascriptInterface public String loadSecure(String key){try{String x=prefs().getString(key,"");return x.isEmpty()?"":decryptString(x);}catch(Exception e){return "";}}
    @JavascriptInterface public void deleteSecure(String key){prefs().edit().remove(key).apply();}
    @JavascriptInterface public void deleteAttachment(String path){try{new File(path).delete();}catch(Exception ignored){}}
    @JavascriptInterface public void save(String filename,String text,String mime){try{File f=new File(exportsDir(),safe(filename));try(FileOutputStream o=new FileOutputStream(f)){o.write(text.getBytes(StandardCharsets.UTF_8));}shareFile(f,mime);}catch(Exception e){Toast.makeText(MainActivity.this,"خطا در خروجی",Toast.LENGTH_LONG).show();}}
    @JavascriptInterface public void savePdf(String filename,String text){try{File f=new File(exportsDir(),safe(filename));makePdf(f,text,null);shareFile(f,"application/pdf");}catch(Exception e){Toast.makeText(MainActivity.this,"خطا در PDF",Toast.LENGTH_LONG).show();}}
    @JavascriptInterface public void saveDocx(String filename,String title,String text){try{File f=new File(exportsDir(),safe(filename));makeDocx(f,title,text);shareFile(f,"application/vnd.openxmlformats-officedocument.wordprocessingml.document");}catch(Exception e){Toast.makeText(MainActivity.this,"خطا در Word",Toast.LENGTH_LONG).show();}}
    @JavascriptInterface public void saveZip(String filename,String caseJson,String reportText,String attachmentJson){try{File f=new File(exportsDir(),safe(filename));makeZip(f,caseJson,reportText,attachmentJson);shareFile(f,"application/zip");}catch(Exception e){Toast.makeText(MainActivity.this,"خطا در ZIP",Toast.LENGTH_LONG).show();}}
    @JavascriptInterface public void savePdfWithAttachments(String filename,String text,String attachmentJson){try{File f=new File(exportsDir(),safe(filename));makePdf(f,text,attachmentJson);shareFile(f,"application/pdf");}catch(Exception e){Toast.makeText(MainActivity.this,"خطا در PDF کامل",Toast.LENGTH_LONG).show();}}
  }

  @Override protected void onActivityResult(int req,int res,Intent data){super.onActivityResult(req,res,data);if(req!=PICK_FILE_REQUEST||res!=RESULT_OK||data==null)return;Uri uri=data.getData();if(uri==null)return;try{
    String name="file",mime=getContentResolver().getType(uri),size="0";Cursor c=getContentResolver().query(uri,null,null,null,null);if(c!=null){if(c.moveToFirst()){int ni=c.getColumnIndex(OpenableColumns.DISPLAY_NAME),si=c.getColumnIndex(OpenableColumns.SIZE);if(ni>=0)name=c.getString(ni);if(si>=0&&!c.isNull(si))size=String.valueOf(c.getLong(si));}c.close();}
    File out=new File(secureAttachmentDir(),System.currentTimeMillis()+"_"+safe(name)+".hye");try(InputStream in=getContentResolver().openInputStream(uri)){writeEncryptedFile(in,out);}String js="window.onHaghyarFilePicked("+JSONObject.quote(pendingQuestionId)+","+JSONObject.quote(name)+","+JSONObject.quote(mime==null?"application/octet-stream":mime)+","+size+","+JSONObject.quote(out.getAbsolutePath())+")";webView.evaluateJavascript(js,null);
  }catch(Exception e){Toast.makeText(this,"خطا در پیوست فایل",Toast.LENGTH_LONG).show();}}

  private String safe(String s){return s.replaceAll("[^\\p{L}\\p{N}._-]","_");}
  private void makePdf(File out,String text,String attachments)throws Exception{
    PdfDocument d=new PdfDocument();TextPaint p=new TextPaint(1);p.setColor(Color.rgb(20,34,52));p.setTextSize(13);p.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));int pageNo=1,y=58;PdfDocument.Page page=d.startPage(new PdfDocument.PageInfo.Builder(595,842,pageNo).create());Canvas canvas=page.getCanvas();
    for(String para:text.split("\\n")){StaticLayout l=StaticLayout.Builder.obtain(para,0,para.length(),p,515).setAlignment(Layout.Alignment.ALIGN_NORMAL).setTextDirection(TextDirectionHeuristics.FIRSTSTRONG_RTL).setLineSpacing(4,1f).build();if(y+l.getHeight()>790){d.finishPage(page);pageNo++;page=d.startPage(new PdfDocument.PageInfo.Builder(595,842,pageNo).create());canvas=page.getCanvas();y=55;}canvas.save();canvas.translate(40,y);l.draw(canvas);canvas.restore();y+=l.getHeight()+8;}d.finishPage(page);
    if(attachments!=null&&!attachments.isEmpty()){JSONArray a=new JSONArray(attachments);for(int i=0;i<a.length();i++){JSONObject o=a.getJSONObject(i);String mime=o.optString("mime",""),path=o.optString("path",""),name=o.optString("name","پیوست");if(mime.startsWith("image/")){byte[] b=readAll(openMaybeEncrypted(path));Bitmap bm=BitmapFactory.decodeByteArray(b,0,b.length);if(bm!=null){pageNo++;PdfDocument.Page pg=d.startPage(new PdfDocument.PageInfo.Builder(595,842,pageNo).create());Canvas cc=pg.getCanvas();float sc=Math.min(515f/bm.getWidth(),730f/bm.getHeight());float w=bm.getWidth()*sc,h=bm.getHeight()*sc;cc.drawBitmap(bm,null,new RectF(40,60,40+w,60+h),null);d.finishPage(pg);bm.recycle();}}else if(mime.equals("application/pdf")){File tmp=File.createTempFile("hy_",".pdf",getCacheDir());try(FileOutputStream fos=new FileOutputStream(tmp)){fos.write(readAll(openMaybeEncrypted(path)));}try(ParcelFileDescriptor fd=ParcelFileDescriptor.open(tmp,ParcelFileDescriptor.MODE_READ_ONLY);PdfRenderer r=new PdfRenderer(fd)){for(int j=0;j<r.getPageCount();j++){PdfRenderer.Page rp=r.openPage(j);Bitmap bm=Bitmap.createBitmap(rp.getWidth(),rp.getHeight(),Bitmap.Config.ARGB_8888);bm.eraseColor(Color.WHITE);rp.render(bm,null,null,PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);pageNo++;PdfDocument.Page pg=d.startPage(new PdfDocument.PageInfo.Builder(595,842,pageNo).create());Canvas cc=pg.getCanvas();float sc=Math.min(515f/bm.getWidth(),730f/bm.getHeight());cc.drawBitmap(bm,null,new RectF(40,55,40+bm.getWidth()*sc,55+bm.getHeight()*sc),null);d.finishPage(pg);bm.recycle();rp.close();}}tmp.delete();}}
    }try(FileOutputStream f=new FileOutputStream(out)){d.writeTo(f);}d.close();
  }
  private void makeDocx(File out,String title,String text)throws Exception{try(ZipOutputStream z=new ZipOutputStream(new FileOutputStream(out))){put(z,"[Content_Types].xml","<?xml version=\"1.0\" encoding=\"UTF-8\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/></Types>");put(z,"_rels/.rels","<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/></Relationships>");StringBuilder b=new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body>");for(String line:(title+"\n"+text).split("\\n")){b.append("<w:p><w:pPr><w:bidi/></w:pPr><w:r><w:rtl/><w:t xml:space=\"preserve\">").append(xml(line)).append("</w:t></w:r></w:p>");}b.append("<w:sectPr><w:bidi/></w:sectPr></w:body></w:document>");put(z,"word/document.xml",b.toString());}}
  private void put(ZipOutputStream z,String name,String s)throws Exception{z.putNextEntry(new ZipEntry(name));z.write(s.getBytes(StandardCharsets.UTF_8));z.closeEntry();}
  private String xml(String s){return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\"","&quot;");}
  private void makeZip(File out,String cj,String rt,String aj)throws Exception{try(ZipOutputStream z=new ZipOutputStream(new FileOutputStream(out))){put(z,"case.json",cj);put(z,"report.txt",rt);JSONArray a=new JSONArray(aj);for(int i=0;i<a.length();i++){JSONObject o=a.getJSONObject(i);String p=o.optString("path","");if(p.isEmpty())continue;z.putNextEntry(new ZipEntry("attachments/"+safe(o.optString("name","file"))));z.write(readAll(openMaybeEncrypted(p)));z.closeEntry();}}}
}
