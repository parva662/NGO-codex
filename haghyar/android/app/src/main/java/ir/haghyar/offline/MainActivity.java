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
import android.database.Cursor;
import android.provider.OpenableColumns;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.view.WindowManager;
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
  private WebView webView; private static final int PICK_FILE_REQUEST=4105; private static final String KEY_ALIAS="haghyar_local_key_v1",PREFS="haghyar_secure_store"; private String pendingQuestionId="";
  @Override public void onCreate(Bundle b){super.onCreate(b);webView=new WebView(this);webView.setBackgroundColor(Color.rgb(245,247,251));setContentView(webView);WebSettings s=webView.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(true);s.setDefaultTextEncodingName("utf-8");webView.setWebViewClient(new WebViewClient(){@Override public void onPageFinished(WebView v,String u){super.onPageFinished(v,u);if(u!=null&&u.endsWith("v1_1.html"))loadPatch(v,"v1_2_patch.js",()->loadPatch(v,"v1_4_knowledge.js",()->loadPatch(v,"v2_commercial_core.js",()->loadPatch(v,"v2_help.js",()->loadPatch(v,"v1_6_ui_fix.js",()->loadPatch(v,"v2_lawyer_brief.js",()->loadPatch(v,"v2_commercial_ui.js",null)))))));}});webView.addJavascriptInterface(new Bridge(),"Android");webView.loadUrl("file:///android_asset/v1_1.html");}
  private interface Done{void run();} private void loadPatch(WebView v,String n,Done d){try{v.evaluateJavascript(readAsset(n),x->{if(d!=null)d.run();});}catch(Exception e){Toast.makeText(this,"خطا در بارگذاری "+n,Toast.LENGTH_LONG).show();}}
  private String readAsset(String n)throws Exception{try(InputStream is=getAssets().open(n);ByteArrayOutputStream os=new ByteArrayOutputStream()){byte[] b=new byte[8192];int x;while((x=is.read(b))>0)os.write(b,0,x);return os.toString("UTF-8");}}
  @Override public void onBackPressed(){if(webView.canGoBack())webView.goBack();else super.onBackPressed();}
  private SecretKey getKey()throws Exception{KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);if(!ks.containsAlias(KEY_ALIAS)){KeyGenerator kg=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");kg.init(new KeyGenParameterSpec.Builder(KEY_ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setKeySize(256).build());kg.generateKey();}return((KeyStore.SecretKeyEntry)ks.getEntry(KEY_ALIAS,null)).getSecretKey();}
  private String encryptString(String p)throws Exception{Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,getKey());return Base64.encodeToString(c.getIV(),2)+"."+Base64.encodeToString(c.doFinal(p.getBytes(StandardCharsets.UTF_8)),2);} private String decryptString(String p)throws Exception{String[] a=p.split("\\.",2);if(a.length!=2)return"";Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,getKey(),new GCMParameterSpec(128,Base64.decode(a[0],2)));return new String(c.doFinal(Base64.decode(a[1],2)),StandardCharsets.UTF_8);}
  private SharedPreferences prefs(){return getSharedPreferences(PREFS,MODE_PRIVATE);} private File secureAttachmentDir(){File d=new File(getFilesDir(),"secure_attachments");d.mkdirs();return d;} private File exportsDir(){File d=new File(getExternalFilesDir(null),"exports");d.mkdirs();return d;}
  private void writeEncryptedFile(InputStream in,File out)throws Exception{Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,getKey());try(FileOutputStream f=new FileOutputStream(out)){f.write(c.getIV().length);f.write(c.getIV());try(CipherOutputStream x=new CipherOutputStream(f,c)){byte[] b=new byte[8192];int n;while((n=in.read(b))>0)x.write(b,0,n);}}}
  private InputStream openMaybeEncrypted(String p)throws Exception{File f=new File(p);if(p.contains("secure_attachments")){FileInputStream i=new FileInputStream(f);int n=i.read();byte[] iv=new byte[n];if(i.read(iv)!=n)throw new IOException();Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,getKey(),new GCMParameterSpec(128,iv));return new CipherInputStream(i,c);}return new FileInputStream(f);} private byte[] readAll(InputStream in)throws Exception{try(InputStream x=in;ByteArrayOutputStream o=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=x.read(b))>0)o.write(b,0,n);return o.toByteArray();}}
  private void shareFile(File f,String m){Uri u=FileProvider.getUriForFile(this,getPackageName()+".files",f);Intent i=new Intent(Intent.ACTION_SEND);i.setType(m);i.putExtra(Intent.EXTRA_STREAM,u);i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);startActivity(Intent.createChooser(i,"اشتراک‌گذاری"));}
  private void deleteTree(File f){if(f==null||!f.exists())return;if(f.isDirectory()){File[] a=f.listFiles();if(a!=null)for(File x:a)deleteTree(x);}f.delete();}
  private boolean deleteAllHaghyarData(){try{prefs().edit().clear().commit();deleteTree(new File(getFilesDir(),"secure_attachments"));deleteTree(new File(getExternalFilesDir(null),"exports"));return true;}catch(Exception e){return false;}}
  public class Bridge{@JavascriptInterface public void pickFile(String id){pendingQuestionId=id;Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("*/*");startActivityForResult(i,PICK_FILE_REQUEST);}@JavascriptInterface public void saveSecure(String k,String v){try{prefs().edit().putString(k,encryptString(v)).apply();}catch(Exception e){}}@JavascriptInterface public String loadSecure(String k){try{String x=prefs().getString(k,"");return x.isEmpty()?"":decryptString(x);}catch(Exception e){return"";}}@JavascriptInterface public void deleteSecure(String k){prefs().edit().remove(k).apply();}@JavascriptInterface public void deleteAttachment(String p){try{File f=new File(p);if(f.getCanonicalPath().startsWith(secureAttachmentDir().getCanonicalPath()))f.delete();}catch(Exception e){}}@JavascriptInterface public boolean deleteAllData(){return deleteAllHaghyarData();}@JavascriptInterface public void setSecureDisplay(boolean enabled){runOnUiThread(()->{if(enabled)getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);});}@JavascriptInterface public void exitApp(){runOnUiThread(()->finishAndRemoveTask());}@JavascriptInterface public void save(String n,String t,String m){try{File f=new File(exportsDir(),safe(n));try(FileOutputStream o=new FileOutputStream(f)){o.write(t.getBytes(StandardCharsets.UTF_8));}shareFile(f,m);}catch(Exception e){}}@JavascriptInterface public void savePdf(String n,String t){try{File f=new File(exportsDir(),safe(n));makePdf(f,t,null);shareFile(f,"application/pdf");}catch(Exception e){}}@JavascriptInterface public void saveDocx(String n,String title,String t){try{File f=new File(exportsDir(),safe(n));makeDocx(f,title,t);shareFile(f,"application/vnd.openxmlformats-officedocument.wordprocessingml.document");}catch(Exception e){}}@JavascriptInterface public void saveZip(String n,String cj,String rt,String aj){try{File f=new File(exportsDir(),safe(n));makeZip(f,cj,rt,aj);shareFile(f,"application/zip");}catch(Exception e){}}}
  @Override protected void onActivityResult(int q,int r,Intent d){super.onActivityResult(q,r,d);if(q!=PICK_FILE_REQUEST||r!=RESULT_OK||d==null)return;Uri u=d.getData();if(u==null)return;try{String n="file",m=getContentResolver().getType(u),z="0";Cursor c=getContentResolver().query(u,null,null,null,null);if(c!=null){if(c.moveToFirst()){int ni=c.getColumnIndex(OpenableColumns.DISPLAY_NAME),si=c.getColumnIndex(OpenableColumns.SIZE);if(ni>=0)n=c.getString(ni);if(si>=0&&!c.isNull(si))z=String.valueOf(c.getLong(si));}c.close();}File o=new File(secureAttachmentDir(),System.currentTimeMillis()+"_"+safe(n)+".hye");try(InputStream in=getContentResolver().openInputStream(u)){writeEncryptedFile(in,o);}webView.evaluateJavascript("window.onHaghyarFilePicked("+JSONObject.quote(pendingQuestionId)+","+JSONObject.quote(n)+","+JSONObject.quote(m==null?"application/octet-stream":m)+","+z+","+JSONObject.quote(o.getAbsolutePath())+")",null);}catch(Exception e){}}
  private String safe(String s){return s.replaceAll("[^\\p{L}\\p{N}._-]","_");}
  private void makePdf(File out,String text,String ignored)throws Exception{PdfDocument d=new PdfDocument();TextPaint p=new TextPaint(1);p.setColor(Color.rgb(20,34,52));p.setTextSize(13);int pn=1,y=58;PdfDocument.Page pg=d.startPage(new PdfDocument.PageInfo.Builder(595,842,pn).create());Canvas c=pg.getCanvas();for(String para:text.split("\\n")){StaticLayout l=StaticLayout.Builder.obtain(para,0,para.length(),p,515).setAlignment(Layout.Alignment.ALIGN_NORMAL).setTextDirection(TextDirectionHeuristics.FIRSTSTRONG_RTL).build();if(y+l.getHeight()>790){d.finishPage(pg);pg=d.startPage(new PdfDocument.PageInfo.Builder(595,842,++pn).create());c=pg.getCanvas();y=55;}c.save();c.translate(40,y);l.draw(c);c.restore();y+=l.getHeight()+8;}d.finishPage(pg);try(FileOutputStream f=new FileOutputStream(out)){d.writeTo(f);}d.close();}
  private void makeDocx(File out,String title,String text)throws Exception{try(ZipOutputStream z=new ZipOutputStream(new FileOutputStream(out))){put(z,"[Content_Types].xml","<?xml version=\"1.0\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/></Types>");put(z,"_rels/.rels","<?xml version=\"1.0\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/></Relationships>");StringBuilder b=new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?><w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body>");for(String l:(title+"\n"+text).split("\\n"))b.append("<w:p><w:pPr><w:bidi/></w:pPr><w:r><w:rtl/><w:t>").append(xml(l)).append("</w:t></w:r></w:p>");b.append("</w:body></w:document>");put(z,"word/document.xml",b.toString());}}
  private void put(ZipOutputStream z,String n,String s)throws Exception{z.putNextEntry(new ZipEntry(n));z.write(s.getBytes(StandardCharsets.UTF_8));z.closeEntry();} private String xml(String s){return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;");}
  private void makeZip(File out,String cj,String rt,String aj)throws Exception{try(ZipOutputStream z=new ZipOutputStream(new FileOutputStream(out))){put(z,"case.json",cj);put(z,"report.txt",rt);JSONArray a=new JSONArray(aj);for(int i=0;i<a.length();i++){JSONObject o=a.getJSONObject(i);String p=o.optString("path","");if(p.isEmpty())continue;z.putNextEntry(new ZipEntry("attachments/"+safe(o.optString("name","file"))));z.write(readAll(openMaybeEncrypted(p)));z.closeEntry();}}}
}