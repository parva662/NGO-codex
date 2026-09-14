package ir.haghyar.offline;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.graphics.pdf.PdfDocument;
import android.graphics.Canvas;
import android.graphics.Color;
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
    webView.setWebViewClient(new WebViewClient());
    webView.addJavascriptInterface(new Bridge(), "Android");
    webView.loadUrl("file:///android_asset/v1_1.html");
  }

  @Override public void onBackPressed() {
    if (webView.canGoBack()) webView.goBack(); else super.onBackPressed();
  }

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
    byte[] iv=c.getIV(), enc=c.doFinal((plain==null?"":plain).getBytes(StandardCharsets.UTF_8));
    byte[] out=new byte[iv.length+enc.length]; System.arraycopy(iv,0,out,0,iv.length); System.arraycopy(enc,0,out,iv.length,enc.length);
    return Base64.encodeToString(out,Base64.NO_WRAP);
  }

  private String decryptString(String packed) throws Exception {
    if(packed==null||packed.isEmpty())return ""; byte[] all=Base64.decode(packed,Base64.NO_WRAP); if(all.length<13)return "";
    byte[] iv=new byte[12]; System.arraycopy(all,0,iv,0,12); byte[] enc=new byte[all.length-12]; System.arraycopy(all,12,enc,0,enc.length);
    Cipher c=Cipher.getInstance("AES/GCM/NoPadding"); c.init(Cipher.DECRYPT_MODE,getKey(),new GCMParameterSpec(128,iv));
    return new String(c.doFinal(enc),StandardCharsets.UTF_8);
  }

  private void encryptToFile(InputStream is, File out) throws Exception {
    Cipher c=Cipher.getInstance("AES/GCM/NoPadding"); c.init(Cipher.ENCRYPT_MODE,getKey()); byte[] iv=c.getIV();
    try(FileOutputStream fos=new FileOutputStream(out)){fos.write(iv);try(CipherOutputStream cos=new CipherOutputStream(fos,c)){byte[] b=new byte[8192];int n;while((n=is.read(b))>0)cos.write(b,0,n);}}
  }

  private InputStream decryptFile(File f) throws Exception {
    FileInputStream fis=new FileInputStream(f); byte[] iv=new byte[12]; if(fis.read(iv)!=12){fis.close();throw new IOException("bad encrypted file");}
    Cipher c=Cipher.getInstance("AES/GCM/NoPadding"); c.init(Cipher.DECRYPT_MODE,getKey(),new GCMParameterSpec(128,iv)); return new CipherInputStream(fis,c);
  }

  private void shareFile(File f, String mime) {
    Uri uri=FileProvider.getUriForFile(this,getPackageName()+".files",f); Intent in=new Intent(Intent.ACTION_SEND); in.setType(mime);
    in.putExtra(Intent.EXTRA_STREAM,uri); in.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION); startActivity(Intent.createChooser(in,"ارسال فایل پرونده حق‌یار"));
  }

  private String safeName(String name){if(name==null||name.trim().isEmpty())return"attachment-"+System.currentTimeMillis();return name.replaceAll("[\\\\/:*?\"<>|]","_");}
  private String xml(String s){return (s==null?"":s).replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\"","&quot;").replace("'","&apos;");}
  private void zipText(ZipOutputStream zos,String path,String text)throws Exception{zos.putNextEntry(new ZipEntry(path));zos.write((text==null?"":text).getBytes(StandardCharsets.UTF_8));zos.closeEntry();}

  private String docxDocument(String content){StringBuilder sb=new StringBuilder();sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body>");for(String line:(content==null?"":content).split("\\n",-1)){sb.append("<w:p><w:pPr><w:bidi/><w:jc w:val=\"right\"/></w:pPr><w:r><w:rPr><w:rtl/><w:lang w:val=\"fa-IR\"/><w:rFonts w:ascii=\"Arial\" w:hAnsi=\"Arial\" w:cs=\"Arial\"/><w:sz w:val=\"24\"/></w:rPr><w:t xml:space=\"preserve\">").append(xml(line)).append("</w:t></w:r></w:p>");}sb.append("<w:sectPr><w:pgSz w:w=\"11906\" w:h=\"16838\"/><w:pgMar w:top=\"1134\" w:right=\"1134\" w:bottom=\"1134\" w:left=\"1134\"/></w:sectPr></w:body></w:document>");return sb.toString();}
  private void writeDocx(File f,String content)throws Exception{try(ZipOutputStream z=new ZipOutputStream(new FileOutputStream(f))){zipText(z,"[Content_Types].xml","<?xml version=\"1.0\" encoding=\"UTF-8\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/></Types>");zipText(z,"_rels/.rels","<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/></Relationships>");zipText(z,"word/document.xml",docxDocument(content));}}

  @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){super.onActivityResult(requestCode,resultCode,data);if(requestCode!=PICK_FILE_REQUEST||resultCode!=RESULT_OK||data==null||data.getData()==null)return;Uri uri=data.getData();try{String name="attachment-"+System.currentTimeMillis();long size=0;Cursor cur=getContentResolver().query(uri,null,null,null,null);if(cur!=null){int ni=cur.getColumnIndex(OpenableColumns.DISPLAY_NAME),si=cur.getColumnIndex(OpenableColumns.SIZE);if(cur.moveToFirst()){if(ni>=0&&cur.getString(ni)!=null)name=cur.getString(ni);if(si>=0&&!cur.isNull(si))size=cur.getLong(si);}cur.close();}String mime=getContentResolver().getType(uri);if(mime==null)mime="application/octet-stream";File dir=new File(getExternalFilesDir(null),"attachments");dir.mkdirs();File out=new File(dir,System.currentTimeMillis()+"-"+safeName(name)+".hye");try(InputStream is=getContentResolver().openInputStream(uri)){if(is!=null)encryptToFile(is,out);}String js="window.onHaghyarFilePicked("+JSONObject.quote(pendingQuestionId)+","+JSONObject.quote(name)+","+JSONObject.quote(mime)+","+size+","+JSONObject.quote(out.getAbsolutePath())+")";webView.evaluateJavascript(js,null);Toast.makeText(this,"مدرک رمزگذاری و اضافه شد",Toast.LENGTH_SHORT).show();}catch(Exception e){Toast.makeText(this,"خطا در افزودن مدرک",Toast.LENGTH_LONG).show();}}

  public class Bridge {
    @JavascriptInterface public void pickFile(String questionId){pendingQuestionId=questionId==null?"":questionId;Intent in=new Intent(Intent.ACTION_OPEN_DOCUMENT);in.addCategory(Intent.CATEGORY_OPENABLE);in.setType("*/*");startActivityForResult(in,PICK_FILE_REQUEST);}
    @JavascriptInterface public String secureGet(String key){try{String p=getSharedPreferences(PREFS,MODE_PRIVATE).getString(key,"");return p.isEmpty()?"":decryptString(p);}catch(Exception e){return"";}}
    @JavascriptInterface public void securePut(String key,String value){try{getSharedPreferences(PREFS,MODE_PRIVATE).edit().putString(key,encryptString(value)).apply();}catch(Exception ignored){}}
    @JavascriptInterface public boolean deleteAttachment(String path){try{return path!=null&&new File(path).delete();}catch(Exception e){return false;}}
    @JavascriptInterface public void saveFile(String name,String content,String mime){try{File dir=new File(getExternalFilesDir(null),"exports");dir.mkdirs();File f=new File(dir,name);try(FileOutputStream os=new FileOutputStream(f)){os.write(content.getBytes(StandardCharsets.UTF_8));}shareFile(f,mime);}catch(Exception e){Toast.makeText(MainActivity.this,"خطا در ساخت فایل",Toast.LENGTH_LONG).show();}}
    @JavascriptInterface public void saveDocx(String name,String content){try{File dir=new File(getExternalFilesDir(null),"exports");dir.mkdirs();File f=new File(dir,name);writeDocx(f,content);shareFile(f,"application/vnd.openxmlformats-officedocument.wordprocessingml.document");}catch(Exception e){Toast.makeText(MainActivity.this,"خطا در ساخت Word",Toast.LENGTH_LONG).show();}}
    @JavascriptInterface public void saveCaseZip(String name,String json,String text,String attachmentsJson){try{File dir=new File(getExternalFilesDir(null),"exports");dir.mkdirs();File f=new File(dir,name);try(ZipOutputStream z=new ZipOutputStream(new FileOutputStream(f))){zipText(z,"case.json",json);zipText(z,"case.txt",text);File tmp=File.createTempFile("haghyar-",".docx",getCacheDir());writeDocx(tmp,text);z.putNextEntry(new ZipEntry("case.docx"));try(FileInputStream in=new FileInputStream(tmp)){byte[] b=new byte[8192];int n;while((n=in.read(b))>0)z.write(b,0,n);}z.closeEntry();tmp.delete();JSONArray arr=new JSONArray(attachmentsJson==null?"[]":attachmentsJson);for(int i=0;i<arr.length();i++){JSONObject o=arr.getJSONObject(i);String path=o.optString("path"),original=safeName(o.optString("name","attachment-"+i));File ef=new File(path);if(!ef.exists())continue;z.putNextEntry(new ZipEntry("attachments/"+original));try(InputStream in=decryptFile(ef)){byte[] b=new byte[8192];int n;while((n=in.read(b))>0)z.write(b,0,n);}z.closeEntry();}}shareFile(f,"application/zip");}catch(Exception e){Toast.makeText(MainActivity.this,"خطا در ساخت بسته پرونده",Toast.LENGTH_LONG).show();}}
    @JavascriptInterface public void savePdf(String name,String content){try{File dir=new File(getExternalFilesDir(null),"exports");dir.mkdirs();File f=new File(dir,name);final int w=595,h=842,m=42,cw=w-m*2,ch=h-m*2;TextPaint paint=new TextPaint(TextPaint.ANTI_ALIAS_FLAG);paint.setColor(Color.rgb(20,31,46));paint.setTextSize(12.5f);paint.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));PdfDocument pdf=new PdfDocument();String rem=content==null?"":content;int pn=1;while(!rem.isEmpty()){StaticLayout full=StaticLayout.Builder.obtain(rem,0,rem.length(),paint,cw).setAlignment(Layout.Alignment.ALIGN_NORMAL).setTextDirection(TextDirectionHeuristics.FIRSTSTRONG_RTL).setLineSpacing(3.5f,1.14f).setIncludePad(true).build();int fit=full.getLineCount()-1;for(int i=0;i<full.getLineCount();i++){if(full.getLineBottom(i)>ch){fit=Math.max(0,i-1);break;}}int end=full.getLineEnd(fit);if(end<=0||end>rem.length())end=Math.min(rem.length(),1000);String pt=rem.substring(0,end).trim();rem=rem.substring(end).trim();StaticLayout pl=StaticLayout.Builder.obtain(pt,0,pt.length(),paint,cw).setAlignment(Layout.Alignment.ALIGN_NORMAL).setTextDirection(TextDirectionHeuristics.FIRSTSTRONG_RTL).setLineSpacing(3.5f,1.14f).setIncludePad(true).build();PdfDocument.PageInfo info=new PdfDocument.PageInfo.Builder(w,h,pn).create();PdfDocument.Page page=pdf.startPage(info);Canvas canvas=page.getCanvas();canvas.drawColor(Color.WHITE);canvas.save();canvas.translate(m,m);pl.draw(canvas);canvas.restore();pdf.finishPage(page);pn++;}if(pn==1){PdfDocument.PageInfo info=new PdfDocument.PageInfo.Builder(w,h,1).create();PdfDocument.Page page=pdf.startPage(info);pdf.finishPage(page);}try(FileOutputStream os=new FileOutputStream(f)){pdf.writeTo(os);}pdf.close();shareFile(f,"application/pdf");}catch(Exception e){Toast.makeText(MainActivity.this,"خطا در ساخت PDF",Toast.LENGTH_LONG).show();}}
  }
}
