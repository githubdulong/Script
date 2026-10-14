// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: project-diagram;
/*
 * @author: 脑瓜
 * @feedback: https://t.me/Scriptable_CN
 * telegram: @anker1209
 * version: 2.3.5
 * update: 2026/10/14
 * 原创UI，修改套用请注明来源
 * 数据：直接按网上国网 Android App 3.2.3 协议登录查询（SM2/SM3/SM4 加密 + Turing 设备令牌），不经过任何第三方网关。
 * 协议与设备令牌算法移植自 stevenjoezhang/hass-state-grid（MIT License, Copyright (c) 2026 stevenjoezhang）。
*/

if (typeof require === 'undefined') require = importModule;
const {DmYY, Runing} = require('./DmYY');

const NATIVE_NS = 'sgcc.scriptable.v1.';
function secretGet(k, fallback = null) {
  try { return (typeof Keychain !== 'undefined' && Keychain.contains(NATIVE_NS + k)) ? JSON.parse(Keychain.get(NATIVE_NS + k)) : fallback; }
  catch (_) { return fallback; }
}
function secretSet(k, v) {
  try { if (typeof Keychain !== 'undefined') Keychain.set(NATIVE_NS + k, JSON.stringify(v)); } catch (_) {}
}
function secretDel(k) {
  try { if (typeof Keychain !== 'undefined' && Keychain.contains(NATIVE_NS + k)) Keychain.remove(NATIVE_NS + k); } catch (_) {}
}
function sensitiveKey(k) { return /sgcc_app_(sess|sms|dev)|sgcc_hark_err/.test(k); }

var SgccProtocol = (() => {

function uk(base, user) { return `${base}_${md5hex(String(user)).slice(0, 8)}`; }
const K = { data: 'sgcc_hark_data2', err: 'sgcc_hark_err2', lock: 'sgcc_hark_lock', dev: 'sgcc_app_dev', sess: 'sgcc_app_sess', sms: 'sgcc_app_sms' };

function clean(v) { return String(v == null ? '' : v).trim(); }
function num(v) { if (typeof v === 'number') return Number.isFinite(v) ? v : NaN; const n = Number(String(v == null ? '' : v).replace(/[^\d.-]/g, '')); return Number.isFinite(n) && String(v == null ? '' : v).trim() !== '' ? n : NaN; }

/* ==================== 加密 ==================== */
// 纯 JS 国网 App 协议加密核心（移植自 MIT 项目 stevenjoezhang/hass-state-grid）
// 原 Copyright (c) 2026 stevenjoezhang, MIT License.
function utf8enc(s){const o=[];for(let i=0;i<s.length;i++){let c=s.charCodeAt(i);if(c>=0xd800&&c<0xdc00&&i+1<s.length){const d=s.charCodeAt(i+1);if(d>=0xdc00&&d<0xe000){c=0x10000+((c-0xd800)<<10)+(d-0xdc00);i++;}}if(c<0x80)o.push(c);else if(c<0x800)o.push(0xc0|(c>>6),0x80|(c&63));else if(c<0x10000)o.push(0xe0|(c>>12),0x80|((c>>6)&63),0x80|(c&63));else o.push(0xf0|(c>>18),0x80|((c>>12)&63),0x80|((c>>6)&63),0x80|(c&63));}return new Uint8Array(o);}
function utf8dec(b){let s='';for(let i=0;i<b.length;){const c=b[i++];let cp;if(c<0x80)cp=c;else if(c<0xe0)cp=((c&31)<<6)|(b[i++]&63);else if(c<0xf0){cp=((c&15)<<12)|((b[i++]&63)<<6)|(b[i++]&63);}else{cp=((c&7)<<18)|((b[i++]&63)<<12)|((b[i++]&63)<<6)|(b[i++]&63);}if(cp>0xffff){cp-=0x10000;s+=String.fromCharCode(0xd800+(cp>>10),0xdc00+(cp&1023));}else s+=String.fromCharCode(cp);}return s;}
function u8(x){ if(x instanceof Uint8Array) return x; if(typeof x==='string') return utf8enc(x); return new Uint8Array(x);}
function toHex(b){let s='';for(let i=0;i<b.length;i++)s+=b[i].toString(16).padStart(2,'0');return s;}
function fromHex(h){const b=new Uint8Array(h.length/2);for(let i=0;i<b.length;i++)b[i]=parseInt(h.substr(i*2,2),16);return b;}
function rotl(x,n){n&=31;return ((x<<n)|(x>>>(32-n)))>>>0;}

/* ===== MD5 ===== */
function md5(input){
  const msg=u8(input);
  const S=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const Kt=[];for(let i=0;i<64;i++)Kt[i]=(Math.floor(Math.abs(Math.sin(i+1))*4294967296))>>>0;
  const ml=msg.length;const bl=ml*8;
  const withpad=((ml+8)>>6)+1;const buf=new Uint8Array(withpad*64);
  buf.set(msg);buf[ml]=0x80;const dv=new DataView(buf.buffer);
  dv.setUint32(buf.length-8,bl>>>0,true);dv.setUint32(buf.length-4,Math.floor(bl/4294967296)>>>0,true);
  let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  for(let off=0;off<buf.length;off+=64){
    const M=[];for(let i=0;i<16;i++)M[i]=dv.getUint32(off+i*4,true);
    let A=a0,B=b0,C=c0,D=d0;
    for(let i=0;i<64;i++){let F,g;
      if(i<16){F=(B&C)|((~B>>>0)&D);g=i;}
      else if(i<32){F=(D&B)|((~D>>>0)&C);g=(5*i+1)&15;}
      else if(i<48){F=B^C^D;g=(3*i+5)&15;}
      else{F=C^(B|(~D>>>0));g=(7*i)&15;}
      F=(F+A+Kt[i]+M[g])>>>0;A=D;D=C;C=B;B=(B+rotl(F,S[i]))>>>0;
    }
    a0=(a0+A)>>>0;b0=(b0+B)>>>0;c0=(c0+C)>>>0;d0=(d0+D)>>>0;
  }
  const out=new Uint8Array(16);const o=new DataView(out.buffer);
  o.setUint32(0,a0,true);o.setUint32(4,b0,true);o.setUint32(8,c0,true);o.setUint32(12,d0,true);
  return out;
}
const md5hex=x=>toHex(md5(x));

/* ===== SHA-256 / HMAC ===== */
function sha256(input){
  const msg=u8(input);
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const ml=msg.length;const bl=ml*8;
  const withpad=((ml+8)>>6)+1;const buf=new Uint8Array(withpad*64);
  buf.set(msg);buf[ml]=0x80;const dv=new DataView(buf.buffer);
  dv.setUint32(buf.length-4,bl>>>0);dv.setUint32(buf.length-8,Math.floor(bl/4294967296)>>>0);
  const w=new Array(64);
  for(let off=0;off<buf.length;off+=64){
    for(let i=0;i<16;i++)w[i]=dv.getUint32(off+i*4);
    for(let i=16;i<64;i++){const s0=rotl(w[i-15],25)^rotl(w[i-15],14)^(w[i-15]>>>3);const s1=rotl(w[i-2],15)^rotl(w[i-2],13)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;}
    let [a,b,c,d,e,f,g,h]=H;
    for(let i=0;i<64;i++){const S1=rotl(e,26)^rotl(e,21)^rotl(e,7);const ch=(e&f)^((~e>>>0)&g);const t1=(h+S1+ch+K[i]+w[i])>>>0;const S0=rotl(a,30)^rotl(a,19)^rotl(a,10);const maj=(a&b)^(a&c)^(b&c);const t2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
    H=[(H[0]+a)>>>0,(H[1]+b)>>>0,(H[2]+c)>>>0,(H[3]+d)>>>0,(H[4]+e)>>>0,(H[5]+f)>>>0,(H[6]+g)>>>0,(H[7]+h)>>>0];
  }
  const out=new Uint8Array(32);const o=new DataView(out.buffer);
  for(let i=0;i<8;i++)o.setUint32(i*4,H[i]);
  return out;
}
function hmacSha256(key,msg){
  key=u8(key);msg=u8(msg);
  if(key.length>64)key=sha256(key);
  const k=new Uint8Array(64);k.set(key);
  const ip=new Uint8Array(64),op=new Uint8Array(64);
  for(let i=0;i<64;i++){ip[i]=k[i]^0x36;op[i]=k[i]^0x5c;}
  const inner=sha256(concat(ip,msg));
  return sha256(concat(op,inner));
}
function concat(...arrs){let n=0;for(const a of arrs)n+=a.length;const o=new Uint8Array(n);let p=0;for(const a of arrs){o.set(a,p);p+=a.length;}return o;}

/* ===== SM3 ===== */
function sm3(input){
  const m=u8(input);const len=m.length;const bitLen=len*8;
  const padLen=((len%64)<56?56:120)-(len%64);
  const buf=new Uint8Array(len+padLen+8);buf.set(m);buf[len]=0x80;
  const dv=new DataView(buf.buffer);
  dv.setUint32(buf.length-4,bitLen>>>0);dv.setUint32(buf.length-8,Math.floor(bitLen/4294967296)>>>0);
  let V=[0x7380166f,0x4914b2b9,0x172442d7,0xda8a0600,0xa96f30bc,0x163138aa,0xe38dee4d,0xb0fb0e4e];
  for(let b=0;b<buf.length;b+=64){
    const W=new Array(68),W1=new Array(64);
    for(let i=0;i<16;i++)W[i]=dv.getUint32(b+i*4);
    for(let i=16;i<68;i++){const x=W[i-16]^W[i-9]^rotl(W[i-3],15);W[i]=(x^rotl(x,15)^rotl(x,23)^rotl(W[i-13],7)^W[i-6])>>>0;}
    for(let i=0;i<64;i++)W1[i]=(W[i]^W[i+4])>>>0;
    let [A,B,C,D,E,F,G,H]=V;
    for(let j=0;j<64;j++){const Tj=j<16?0x79cc4519:0x7a879d8a;const SS1=rotl((rotl(A,12)+E+rotl(Tj,j))>>>0,7);const SS2=(SS1^rotl(A,12))>>>0;const FF=j<16?(A^B^C):((A&B)|(A&C)|(B&C));const GG=j<16?(E^F^G):((E&F)|((~E>>>0)&G));const TT1=(FF+D+SS2+W1[j])>>>0;const TT2=(GG+H+SS1+W[j])>>>0;D=C;C=rotl(B,9);B=A;A=TT1;H=G;G=rotl(F,19);F=E;E=(TT2^rotl(TT2,9)^rotl(TT2,17))>>>0;}
    V=[(V[0]^A)>>>0,(V[1]^B)>>>0,(V[2]^C)>>>0,(V[3]^D)>>>0,(V[4]^E)>>>0,(V[5]^F)>>>0,(V[6]^G)>>>0,(V[7]^H)>>>0];
  }
  const out=new Uint8Array(32);const o=new DataView(out.buffer);for(let i=0;i<8;i++)o.setUint32(i*4,V[i]);return out;
}
const sm3hex=x=>toHex(sm3(x));
// sm3 kdf: z is bytes
function sm3kdf(z,klen){let ct=1;let out=new Uint8Array(0);const n=Math.ceil(klen/32);for(let i=0;i<n;i++){const cnt=new Uint8Array(4);new DataView(cnt.buffer).setUint32(0,ct);out=concat(out,sm3(concat(z,cnt)));ct++;}return out.slice(0,klen);}

/* ===== SM4 ECB PKCS7 ===== */
const SM4_SBOX=fromHex('d690e9fecce13db716b614c228fb2c05 2b679a762abe04c3aa441326498606999c4250f491ef987a33540b43edcfac62 e4b31ca9c908e89580df94fa758f3fa6 4707a7fcf37317ba83593c19e6854fa8 686b81b27164da8bf8eb0f4b70569d35 1e240e5e6358d1a225227c3b01217887 d40046579fd327524c3602e7a0c4c89e eabf8ad240c738b5a3f7f2cef96115a1 e0ae5da49b341a55ad933230f58cb1e3 1df6e22e8266ca60c02923ab0d534e6f d5db3745defd8e2f03ff6a726d6c5b51 8d1baf92bbddbc7f11d95c411f105ad8 0ac13188a5cd7bbd2d74d012b8e5b4b0 8969974a0c96777e65b9f109c56ec684 18f07dec3adc4d2079ee5f3ed7cb3948'.replace(/\s/g,''));
const SM4_CK=[0x00070e15,0x1c232a31,0x383f464d,0x545b6269,0x70777e85,0x8c939aa1,0xa8afb6bd,0xc4cbd2d9,0xe0e7eef5,0xfc030a11,0x181f262d,0x343b4249,0x50575e65,0x6c737a81,0x888f969d,0xa4abb2b9,0xc0c7ced5,0xdce3eaf1,0xf8ff060d,0x141b2229,0x30373e45,0x4c535a61,0x686f767d,0x848b9299,0xa0a7aeb5,0xbcc3cad1,0xd8dfe6ed,0xf4fb0209,0x10171e25,0x2c333a41,0x484f565d,0x646b7279];
const SM4_FK=[0xa3b1bac6,0x56aa3350,0x677d9197,0xb27022dc];
function sm4tau(a){return ((SM4_SBOX[(a>>>24)&0xff]<<24)|(SM4_SBOX[(a>>>16)&0xff]<<16)|(SM4_SBOX[(a>>>8)&0xff]<<8)|SM4_SBOX[a&0xff])>>>0;}
function sm4L(b){return (b^rotl(b,2)^rotl(b,10)^rotl(b,18)^rotl(b,24))>>>0;}
function sm4Lp(b){return (b^rotl(b,13)^rotl(b,23))>>>0;}
function sm4Key(key){const MK=[];for(let i=0;i<4;i++)MK[i]=((key[i*4]<<24)|(key[i*4+1]<<16)|(key[i*4+2]<<8)|key[i*4+3])>>>0;const K=[MK[0]^SM4_FK[0],MK[1]^SM4_FK[1],MK[2]^SM4_FK[2],MK[3]^SM4_FK[3]];const rk=[];for(let i=0;i<32;i++){const t=(K[i+1]^K[i+2]^K[i+3]^SM4_CK[i])>>>0;const r=(K[i]^sm4Lp(sm4tau(t)))>>>0;K[i+4]=r;rk[i]=r;}return rk;}
function sm4Block(rk,inp,enc){let X=[((inp[0]<<24)|(inp[1]<<16)|(inp[2]<<8)|inp[3])>>>0,((inp[4]<<24)|(inp[5]<<16)|(inp[6]<<8)|inp[7])>>>0,((inp[8]<<24)|(inp[9]<<16)|(inp[10]<<8)|inp[11])>>>0,((inp[12]<<24)|(inp[13]<<16)|(inp[14]<<8)|inp[15])>>>0];for(let i=0;i<32;i++){const k=enc?rk[i]:rk[31-i];const t=(X[i+1]^X[i+2]^X[i+3]^k)>>>0;X[i+4]=(X[i]^sm4L(sm4tau(t)))>>>0;}const o=[X[35],X[34],X[33],X[32]];const out=new Uint8Array(16);for(let i=0;i<4;i++){out[i*4]=(o[i]>>>24)&0xff;out[i*4+1]=(o[i]>>>16)&0xff;out[i*4+2]=(o[i]>>>8)&0xff;out[i*4+3]=o[i]&0xff;}return out;}
function sm4EncryptEcb(data,key){const rk=sm4Key(key);const pad=16-(data.length%16);const buf=new Uint8Array(data.length+pad);buf.set(data);for(let i=data.length;i<buf.length;i++)buf[i]=pad;const out=new Uint8Array(buf.length);for(let i=0;i<buf.length;i+=16)out.set(sm4Block(rk,buf.subarray(i,i+16),true),i);return out;}
function sm4DecryptEcb(data,key){const rk=sm4Key(key);const out=new Uint8Array(data.length);for(let i=0;i<data.length;i+=16)out.set(sm4Block(rk,data.subarray(i,i+16),false),i);const pad=out[out.length-1];return out.slice(0,out.length-pad);}
// App: key text 32 hex chars, uses first 16 ASCII bytes as key
function sm4KeyBytes(keyText){return u8(keyText.slice(0,16));}
function sm4EncryptHex(plain,keyText){return toHex(sm4EncryptEcb(u8(plain),sm4KeyBytes(keyText))).toUpperCase();}
function sm4DecryptHex(hex,keyText){return sm4DecryptEcb(fromHex(hex),sm4KeyBytes(keyText));}

/* ===== AES-256 ECB (check code) ===== */
// robust AES sbox
function aesSboxCompute(){const sbox=new Uint8Array(256);let p=1,q=1;do{p=p^(p<<1)^((p&0x80)?0x11b:0);p&=0xff;q^=q<<1;q^=q<<2;q^=q<<4;q&=0xff;if(q&0x80)q^=0x09;const xf=q^((q<<1)|(q>>>7))^((q<<2)|(q>>>6))^((q<<3)|(q>>>5))^((q<<4)|(q>>>4));sbox[p]=(xf^0x63)&0xff;}while(p!==1);sbox[0]=0x63;return sbox;}
const ASB=aesSboxCompute();
function aesExpand(key){const Nk=8,Nr=14,w=new Uint8Array(4*4*(Nr+1));w.set(key);const rcon=[0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36,0x6c,0xd8,0xab,0x4d];let i=Nk;const tmp=new Uint8Array(4);while(i<4*(Nr+1)){for(let k=0;k<4;k++)tmp[k]=w[(i-1)*4+k];if(i%Nk===0){const t=tmp[0];tmp[0]=ASB[tmp[1]]^rcon[i/Nk-1];tmp[1]=ASB[tmp[2]];tmp[2]=ASB[tmp[3]];tmp[3]=ASB[t];}else if(i%Nk===4){for(let k=0;k<4;k++)tmp[k]=ASB[tmp[k]];}for(let k=0;k<4;k++)w[i*4+k]=w[(i-Nk)*4+k]^tmp[k];i++;}return {w,Nr};}
function xtime(a){return ((a<<1)^((a&0x80)?0x11b:0))&0xff;}
function aesEncryptBlock(st,w,Nr){const s=st.slice();for(let k=0;k<16;k++)s[k]^=w[k];for(let r=1;r<Nr;r++){for(let k=0;k<16;k++)s[k]=ASB[s[k]];// shiftrows (column-major state: s[r+4c])
    aesShift(s);aesMix(s);for(let k=0;k<16;k++)s[k]^=w[r*16+k];}
  for(let k=0;k<16;k++)s[k]=ASB[s[k]];aesShift(s);for(let k=0;k<16;k++)s[k]^=w[Nr*16+k];return s;}
function aesShift(s){const t=[s[0],s[5],s[10],s[15],s[4],s[9],s[14],s[3],s[8],s[13],s[2],s[7],s[12],s[1],s[6],s[11]];for(let i=0;i<16;i++)s[i]=t[i];}
function aesMix(s){for(let c=0;c<4;c++){const o=c*4;const a0=s[o],a1=s[o+1],a2=s[o+2],a3=s[o+3];s[o]=xtime(a0)^(xtime(a1)^a1)^a2^a3;s[o+1]=a0^xtime(a1)^(xtime(a2)^a2)^a3;s[o+2]=a0^a1^xtime(a2)^(xtime(a3)^a3);s[o+3]=(xtime(a0)^a0)^a1^a2^xtime(a3);}}
function aes256EcbEncrypt(data,key){const {w,Nr}=aesExpand(key);const pad=16-(data.length%16);const buf=new Uint8Array(data.length+pad);buf.set(data);for(let i=data.length;i<buf.length;i++)buf[i]=pad;const out=new Uint8Array(buf.length);for(let i=0;i<buf.length;i+=16)out.set(aesEncryptBlock(buf.subarray(i,i+16),w,Nr),i);return out;}

/* ===== SM2 ===== */
const SM2_P=BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF');
const SM2_A=BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC');
const SM2_B=BigInt('0x28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93');
const SM2_GX=BigInt('0x32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7');
const SM2_GY=BigInt('0xBC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0');
function mod(a,m){return ((a%m)+m)%m;}
function inv(a,m){let [old_r,r]=[mod(a,m),m];let [old_s,s]=[1n,0n];while(r!==0n){const q=old_r/r;[old_r,r]=[r,old_r-q*r];[old_s,s]=[s,old_s-q*s];}return mod(old_s,m);}
function ptAdd(P,Q){if(!P)return Q;if(!Q)return P;const [x1,y1]=P,[x2,y2]=Q;if(x1===x2&&mod(y1+y2,SM2_P)===0n)return null;let l;if(x1===x2&&y1===y2){l=mod((3n*x1*x1+SM2_A)*inv(2n*y1,SM2_P),SM2_P);}else{l=mod((y2-y1)*inv(mod(x2-x1,SM2_P),SM2_P),SM2_P);}const x3=mod(l*l-x1-x2,SM2_P);const y3=mod(l*(x1-x3)-y1,SM2_P);return [x3,y3];}
function ptMul(k,P){let R=null,N=P;while(k>0n){if(k&1n)R=ptAdd(R,N);N=ptAdd(N,N);k>>=1n;}return R;}
const G=[SM2_GX,SM2_GY];
function b32(n){let h=n.toString(16).padStart(64,'0');return fromHex(h);}
// encrypt 32-char key text ascii -> "04"+C1C3C2 hex (mode 1)
function sm2EncryptKey(keyText,serverPubHex){const msg=u8(keyText);let pub=serverPubHex;if(pub.length===130)pub=pub.slice(2);const px=BigInt('0x'+pub.slice(0,64)),py=BigInt('0x'+pub.slice(64));
  let k,C1,xy;do{k=BigInt('0x'+toHex(randomBytes(32)))%SM2_P;if(k===0n)continue;C1=ptMul(k,G);xy=ptMul(k,[px,py]);}while(!C1||!xy);
  const x2=b32(xy[0]),y2=b32(xy[1]);const t=sm3kdf(concat(x2,y2),msg.length);let ok=false;for(const b of t)if(b!==0){ok=true;break;}if(!ok)return sm2EncryptKey(keyText,serverPubHex);
  const C2=new Uint8Array(msg.length);for(let i=0;i<msg.length;i++)C2[i]=msg[i]^t[i];
  const C3=sm3(concat(x2,msg,y2));
  const c1hex=b32(C1[0]).length?toHex(b32(C1[0]))+toHex(b32(C1[1])):'';
  return '04'+toHex(concat(b32(C1[0]),b32(C1[1]),C3,C2));
}
function sm2DecryptKey(wrapHex,privHex){let w=wrapHex.toLowerCase().startsWith('04')?wrapHex.slice(2):wrapHex;const C1=[BigInt('0x'+w.slice(0,64)),BigInt('0x'+w.slice(64,128))];const C3=w.slice(128,192);const C2=fromHex(w.slice(192));const d=BigInt('0x'+privHex);const xy=ptMul(d,C1);const x2=b32(xy[0]),y2=b32(xy[1]);const t=sm3kdf(concat(x2,y2),C2.length);const M=new Uint8Array(C2.length);for(let i=0;i<C2.length;i++)M[i]=C2[i]^t[i];return M;}
function sm2DerivePub(privHex){const d=BigInt('0x'+privHex);const P=ptMul(d,G);return toHex(b32(P[0]))+toHex(b32(P[1]));}

/* ===== random ===== */
function randomBytes(n){if(typeof globalThis!=='undefined'&&globalThis.crypto&&globalThis.crypto.getRandomValues){const b=new Uint8Array(n);globalThis.crypto.getRandomValues(b);return b;}const b=new Uint8Array(n);for(let i=0;i<n;i++)b[i]=Math.floor(Math.random()*256);return b;}

/* ===== turing hash64 (BigInt) ===== */
const M64=(1n<<64n)-1n;const TMUL=0xC6A4A7935BD1E995n;
function u64(v){return v&M64;}
function mix47(v){v=u64(v);return u64(v^(v>>47n));}
function turingHash64(data,seed){data=u8(data);const length=BigInt(data.length);let state=u64(u64(length*TMUL)^BigInt(seed>>>0));const blocks=data.length>>3;for(let i=0;i<blocks;i++){let word=0n;for(let j=7;j>=0;j--)word=(word<<8n)|BigInt(data[i*8+j]);word=u64(mix47(u64(word*TMUL))*TMUL);state=u64((word^state)*TMUL);}const tail=data.subarray(blocks*8);if(tail.length>=7)state^=BigInt(tail[6])<<48n;if(tail.length>=6)state^=BigInt(tail[5])<<40n;if(tail.length>=5)state^=BigInt(tail[4])<<32n;if(tail.length>=4)state^=BigInt(tail[3])<<24n;if(tail.length>=3)state^=BigInt(tail[2])<<16n;if(tail.length>=2)state^=0x118727C03FB9FFC6n&(BigInt(tail[1])<<8n);if(tail.length>=1){state^=BigInt(tail[0]);state=u64(state*TMUL);}state=mix47(state);state=u64(state*TMUL);return mix47(state);}

/* ===== XXTEA (Quarenden.a with embedded length) ===== */
const DELTA=0x9E3779B9;
function _xxteaKey(keyBytes){let material=keyBytes&&keyBytes.length?keyBytes:u8('DFG#$%^#%$RGHR(&*M<><');if(material.length>16)material=md5(material);const m=new Uint8Array(16);m.set(material.subarray(0,16));const dv=new DataView(m.buffer);return [dv.getUint32(0,true),dv.getUint32(4,true),dv.getUint32(8,true),dv.getUint32(12,true)];}
function _mx(sum,y,z,p,e,key){return (((((z>>>5)^((y<<2)>>>0))>>>0)+(((y>>>3)^((z<<4)>>>0))>>>0))>>>0 ^ ((((y^sum)>>>0)+((z^key[(p&3)^e])>>>0))>>>0))>>>0;}
function xxteaEncrypt(plain,keyBytes){if(!plain.length)return plain;const count=((plain.length/4)|0)+(plain.length%4===0?1:2);const values=new Array(count).fill(0);for(let i=0;i<plain.length;i++)values[i>>2]=(values[i>>2]|(plain[i]<<((i%4)*8)))>>>0;values[count-1]=plain.length;const n=count-1;const key=_xxteaKey(keyBytes);let rounds=6+((52/(n+1))|0);let total=0;let z=values[n];while(rounds){total=(total+DELTA)>>>0;const e=(total>>>2)&3;for(let p=0;p<n;p++){const y=values[p+1];values[p]=(values[p]+_mx(total,y,z,p,e,key))>>>0;z=values[p];}const y=values[0];values[n]=(values[n]+_mx(total,y,z,n,e,key))>>>0;z=values[n];rounds--;}const out=new Uint8Array(count*4);const dv=new DataView(out.buffer);for(let i=0;i<count;i++)dv.setUint32(i*4,values[i],true);return out;}

/* ===== RSA PKCS1 v1.5 (Turing public key) ===== */
const RSA_N=BigInt('0xb595f83a8a0ee3c16261addfc3353e7e13c73b762c3013f53225752a9fa8b0d0c33ed7f810f0a3bb323be5e6bef036eaf2e41e0975accd2a565161f573617492197904e0b30cbc9dd7aea2e079e1de3596dcf36ef444e1f3569987d737e7753e7367e893f9cf71ea661a6de3977199adcc6937dff6c1870297eb744d6473f8fb93367d17f3f51fe229e6c5424359c95985aa3ca18299334f6b1fa2d16198accc057d1e93b76fd385774fbf040453a9dfaa51b7ce6cc8778c6bc84148ec6e9213fadb4f96a4b84728953d4546d60c98b92fbf5cd5db079f4c90c968ac8ce3edeb2f0bde85e4e6399ca97b86faee15f1ef1296e8e0e2f88e6bde00c520bb871225');
const RSA_E=65537n;
function modpow(b,e,m){let r=1n;b%=m;while(e>0n){if(e&1n)r=(r*b)%m;e>>=1n;b=(b*b)%m;}return r;}
function rsaEncrypt(message){const size=256;const ps=size-message.length-3;const pad=new Uint8Array(ps);let f=0;while(f<ps){const r=randomBytes(ps);for(let i=0;i<r.length&&f<ps;i++)if(r[i]!==0)pad[f++]=r[i];}const enc=concat(new Uint8Array([0,2]),pad,new Uint8Array([0]),message);const c=modpow(BigInt('0x'+toHex(enc)),RSA_E,RSA_N);return b256(c,size);}
function b256(n,size){let h=n.toString(16).padStart(size*2,'0');return fromHex(h);}

/* ===== deflate (stored blocks) + zlib wrapper ===== */
function adler32(data){let a=1,b=0;for(let i=0;i<data.length;i++){a=(a+data[i])%65521;b=(b+a)%65521;}return ((b<<16)|a)>>>0;}
function zlibCompressStored(data){const parts=[new Uint8Array([0x78,0x01])];let i=0;while(i<data.length){const len=Math.min(65535,data.length-i);const last=(i+len>=data.length)?1:0;const hdr=new Uint8Array(5);hdr[0]=last;hdr[1]=len&0xff;hdr[2]=(len>>8)&0xff;hdr[3]=(~len)&0xff;hdr[4]=((~len)>>8)&0xff;parts.push(hdr,data.subarray(i,i+len));i+=len;}const ad=adler32(data);parts.push(new Uint8Array([(ad>>>24)&0xff,(ad>>>16)&0xff,(ad>>>8)&0xff,ad&0xff]));return concat(...parts);}


/* ==================== Turing 设备令牌 ==================== */
const REF_NATIVE = {"21":"0","108":"5","7":"","10":"5939.59,5939.59","105":"100","14":"1080*2154","101":"0","152":"0","103":"0","104":"2","33":"33","11":"type=1:name=Goldfish 3-axis Accelerometer:vendor=The Android Open Source Project:resolution=2.480159E-4:,type=4:name=Goldfish 3-axis Gyroscope:vendor=The Android Open Source Project:resolution=0.001:,type=2:name=Goldfish 3-axis Magnetic field sensor:vendor=The Android Open Source Project:resolution=0.5:,type=5:name=Goldfish Light sensor:vendor=The Android Open Source Project:resolution=1.0:,type=6:name=Goldfish Pressure sensor:vendor=The Android Open Source Project:resolution=1.0:,","24":"sdk_gphone64_arm64","12":"","23":"google","8":"google/sdk_gphone64_arm64/emu64a:13/TE1A.240213.009/12342917:userdebug/dev-keys","13":"1000.0","25":"13","20":"0","100":"","22":"","102":"0","106":"","115":"","113":"0","114":"0","44":"","35":"","42":"Google","107":"com.sgcc.wsgw.cn_DAB5608ECD1ABEF80E5FA277CF3B8D50","200":"32,2,3,4,36,5,6,40,136,43,45,143,144,10002,19,10003","116":"","117":"1","45":"","118":"v4;-1_v6;-1","120":"rwxp;/apex/com.android.art/lib64/libart.so,rwxp;/apex/com.android.runtime/lib64/bionic/libdl.so,rwxp;/system/lib64/libz.so","121":"","122":"","135":"tmpfs:/dev:tmpfs:rw&seclabel&nosuid&relatime&mode=755,tmpfs:/mnt:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=755&gid=1000,/dev/fuse:/mnt/installer/0/emulated:fuse:rw&lazytime&nosuid&nodev&noexec&noatime&user_id=0&group_id=0&allow_other,/dev/block/platform/a003c00.virtio_mmio/by-name/metadata:/metadata:ext4:rw&seclabel&nosuid&nodev&noatime,tmpfs:/apex:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=755,tmpfs:/apex/apex-info-list.xml:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=755,/dev/fuse:/storage/emulated:fuse:rw&lazytime&nosuid&nodev&noexec&noatime&user_id=0&group_id=0&allow_other,tmpfs:/data/data:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,tmpfs:/data/user:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,tmpfs:/data/user_de:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,tmpfs:/data/misc/profiles/cur:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,tmpfs:/data/misc/profiles/ref:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,/dev/block/loop::13,/dev/block/dm::71","124":"","131":"0,0,Built-in Screen,1080x2220,131,1,0,","137":"-8233870966039513836:enforcing,7247450386580705748:0,3920320800439300925:T-Mobile","133":"android.content.pm.IPackageManager$Stub$Proxy,,","140":"0,0,,0,,","138":"5,1","149":"en-US","150":"Asia/Shanghai","151":"310260","9":"/dev/block/dm-0:802660,tmpfs:1006268,tmpfs:1006268,/dev/block/dm-4:98620,/dev/block/dm-3:2122372,/dev/block/dm-2:175392,tmpfs:1006268,/dev/block/loop4:784,","15":"Ring_Synth_04.ogg","46":"0","51":""};
const JAVA_CONST = {"2013":"/dev/qemu_pipe,/dev/vboxguest,/dev/vboxuser,/system/framework/org.lineageos.platform-res.apk,/system/lib/ccc,/dev/socket/baseband_genyd,/sys/class/misc/vboxguest,/system/priv-app/CMSettingsProvider,/system/lib64/ccc,/ueventd.ttVM_x86.rc,/init.ttVM_x86.rc,/system/lib/hw/sensors.vbox86.so,/hmdocker,/system/lib/libnemuVMprop.so,/system/bin/magiskpolicy,/system/bin/qemud,/ueventd.vbox86.rc,/system/bin/androVM_setprop,/dev/socket/genyd,/sys/module/vboxguest,/system/priv-app/LineageSettingsProvider,/system/lib/hw/gps.vbox86.so,/system/etc/init.buildroid.sh,/system/lib/hw/audio.primary.vbox86.so,/sys/qemu_trace,/sys/class/misc/vboxuser,/system/bin/mount.nemusf,/ueventd.andy.rc,/system/priv-app/vmos-pro-intent,/sys/module/vboxvideo,/system/lib/hw/gralloc.vbox86.so,/proc/device-tree/goldfish_pipe@a060000,/system/addon.d/50-lineage.sh,/system/priv-app/romex,/system/lib64/arm64/nb/libc.so,/dev/socket/qemud,/data/.bluestacks.prop,/ueventd.android_x86.rc,/.dockerenv,/system/bin/magisk,/system/lib64/libc.so,/system/lib64/.aa,/fstab.andy,/dev/apksafe_pipe,/fstab.vbox86,/ueventd.nox.rc,/init.nox.rc,/system/app/DotPapers,/system/lib/.aa,/init.goldfish.rc,/x86.prop,/dev/mumuvmmguest,/dev/mumuvmmuser,/proc/device-tree/virtio_mmio@a000000,/system/bin/nemuVM-nemu-service,/sys/module/vboxsf,/dev/goldfish_pipe,/system/lib/hw/camera.vbox86.so,/system/priv-app/MuMuAudio,/sys/devices/virtual/misc/vboxguest,/system/bin/androVM-prop,/sys/devices/virtual/misc/vboxuser,/system/addon.d/99-magisk.sh,/fstab.nox,/system/lib64/libriruloader.so,/fstab.ttVM_x86,/system/etc/mumu-configs,/init.vbox86.rc","2016":"com/wind/xpatch/proxy/XpatchProxyApplication,de/robv/android/xposed/XposedHelpers,com/wind/xposed/entry/XposedModuleEntry,com/bug/fuck/fuck","2017":"ro.boot.flash.locked,ro.boot.vbmeta.device_state,ro.boot.verifiedbootstate,ro.boot.veritymode,ro.boot.warranty_bit,ro.debuggable,ro.secure,ro.secureboot.lockstate,ro.vendor.boot.warranty_bit,ro.vendor.warranty_bit,ro.warranty_bit,vendor.boot.vbmeta.device_state,ro.lineage.device,ro.dotOS.device,ro.dalvik.vm.native.bridge,nemud.player_package,init.svc.nemuinit"};
const PKG='com.sgcc.wsgw.cn',CHANNEL='10000191',BUILD_MARKER='77F2B17A00A92C71';
/* ===== JCE writer ===== */
class Jce{constructor(){this.b=[];}
  head(tag,t){if(tag<15)this.b.push((tag<<4)|t);else{this.b.push(0xF0|t,tag);}}
  zero(tag){this.head(tag,12);}
  byte(tag,v){v=Number(v);if(v===0)this.zero(tag);else{this.head(tag,0);this.b.push(v&0xff);}}
  short(tag,v){v=Number(v);if(v>=-128&&v<=127)this.byte(tag,v);else{this.head(tag,1);this.b.push((v>>8)&0xff,v&0xff);}}
  int32(tag,v){v=Number(v);if(v>=-32768&&v<=32767)this.short(tag,v);else{this.head(tag,2);this.b.push((v>>>24)&0xff,(v>>>16)&0xff,(v>>>8)&0xff,v&0xff);}}
  int64(tag,v){const n=BigInt(v);if(n>=-2147483648n&&n<=2147483647n)this.int32(tag,Number(n));else{this.head(tag,3);let x=BigInt.asUintN(64,n);const o=[];for(let i=0;i<8;i++){o.unshift(Number(x&0xffn));x>>=8n;}this.b.push(...o);}}
  string(tag,v){const raw=typeof v==='string'?u8(v):v;if(raw.length<=255){this.head(tag,6);this.b.push(raw.length);}else{this.head(tag,7);const l=raw.length;this.b.push((l>>>24)&0xff,(l>>>16)&0xff,(l>>>8)&0xff,l&0xff);}for(let i=0;i<raw.length;i++)this.b.push(raw[i]);}
  mapIntStr(tag,entries){this.head(tag,8);this.int32(0,entries.length);for(const [k,v] of entries){this.int32(0,k);this.string(1,v);}}
  struct(tag,fields){this.head(tag,10);for(let i=0;i<fields.length;i++)this.b.push(fields[i]);this.head(0,11);}
  finish(){return new Uint8Array(this.b);}
}
/* ===== profile ===== */
const JAVA_PERF_ORDER=[133,138,140,-17,17,145,146,149,22,150,151,24,100,101,102,103,104,105,106,107,44,113,114,115,116,117,118,120,122,'s9'];
const JAVA_PERF_REF={133:0,138:1,140:0,'-17':0,17:1,145:0,146:0,149:0,22:1,150:0,151:0,24:0,100:6,101:114,102:0,103:0,104:0,105:0,106:3,107:0,44:0,113:2,114:1,115:1,116:0,117:0,118:0,120:8,122:0,s9:1};
const NATIVE_PERF_ORDER=[21,7,10,14,33,11,24,12,23,8,13,25,20,35,42,121,135,124,125,129,131,134,132,137,142,141,9,15,16];
const NATIVE_PERF_REF={21:1,7:0,10:3,14:0,33:0,11:0,24:0,12:0,23:0,8:0,13:0,25:0,20:0,35:0,42:0,121:1,135:2,124:0,125:0,129:0,131:0,134:0,132:0,137:1,142:0,141:0,9:16,15:0,16:0};
const PROC_TPL=[[-1,3,1000,17,0,438,3],[-1,1,0,20,0,493,3],[1,1,1000,1864,1036632,420,2],[-1,1,0,20,0,493,2],[1,3,1000,17,0,438,3],[1,1,null,19,0,292,6],[-1,1,null,19,0,292,6]];
function b64(bytes){const A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';let s='';let i=0;for(;i+2<bytes.length;i+=3){const n=(bytes[i]<<16)|(bytes[i+1]<<8)|bytes[i+2];s+=A[(n>>18)&63]+A[(n>>12)&63]+A[(n>>6)&63]+A[n&63];}if(i<bytes.length){const n=(bytes[i]<<16)|((i+1<bytes.length?bytes[i+1]:0)<<8);s+=A[(n>>18)&63]+A[(n>>12)&63]+(i+1<bytes.length?A[(n>>6)&63]:'=')+'=';}return s;}
function b64url(bytes){return b64(bytes).replace(/\+/g,'-').replace(/\//g,'_');}
function b64dec(s){const A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';s=s.replace(/=+$/,'');const out=[];let buf=0,bits=0;for(const ch of s){buf=(buf<<6)|A.indexOf(ch);bits+=6;if(bits>=8){bits-=8;out.push((buf>>bits)&0xff);}}return new Uint8Array(out);}
class Profile{
  constructor(seed,boot,install){this.seed=seed;this.boot=boot;this.install=install;this._c={};}
  bytes(label,size=32){const key=label+'|'+size;if(this._c[key])return this._c[key];const out=[];let ctr=0;while(out.length<size){const c=new Uint8Array(4);new DataView(c.buffer).setUint32(0,ctr);const d=hmacSha256(this.seed,concat(u8('wsgw-turing-profile-v1\0'+label),c));for(const x of d)out.push(x);ctr++;}const r=new Uint8Array(out.slice(0,size));this._c[key]=r;return r;}
  hex(label,size=16){return toHex(this.bytes(label,size));}
  integerBig(label,lo,hi){lo=BigInt(lo);hi=BigInt(hi);const v=BigInt('0x'+toHex(this.bytes(label,8)));return lo+v%(hi-lo+1n);}
  integer(label,lo,hi){return Number(this.integerBig(label,lo,hi));}
  reqInt(label,ts,lo,hi){return this.integer(`request:${ts}:${label}`,lo,hi);}
  uuid(label){const v=Array.from(this.bytes(label,16));v[6]=(v[6]&0x0f)|0x40;v[8]=(v[8]&0x3f)|0x80;const h=toHex(v);return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
  identity(){if(this._id)return this._id;const mac=Array.from(this.bytes('wifi-mac',6));mac[0]=(mac[0]&0xfe)|0x02;this._id={profile_id:this.uuid('profile-id'),android_id:this.hex('android-id',8),oaid:this.uuid('oaid'),brand:'google',model:'sdk_gphone64_arm64',release:'13',package_name:PKG,channel:CHANNEL};return this._id;}
  timing(label,ts,ref){if(ref<=0)return 0;const radius=Math.max(1,Math.floor(ref/4));const digits=String(ref).length;const lo=digits>1?10**(digits-1):0;const hi=10**digits-1;return this.reqInt(`timing:${label}`,ts,Math.max(lo,ref-radius),Math.min(hi,ref+radius));}
  javaPerf(ts){return JAVA_PERF_ORDER.map(f=>`${f}_${this.timing(String(f),ts,JAVA_PERF_REF[String(f)])}`).join(',');}
  directPerf(ts){const s=NATIVE_PERF_ORDER.map(f=>`${f}_${this.timing('native-'+f,ts,NATIVE_PERF_REF[f])}`).join(',');return `${this.javaPerf(ts)},${s}`;}
  nativeMap(cur){const id=this.identity();const boot=this.boot;const uid=this.integer('uid',10000,19999);const install=this.install;
    const ia=b64url(this.bytes('install-a',16));const ib=b64url(this.bytes('install-b',16)).replace(/=+$/,'')+'=';
    const ictx=`1:1:${uid}:${install}:${id.package_name}::${this.integer('install-slot',100000000,999999999)}:app/~~${ia}/-${ib},`;
    const pe=PROC_TPL.map((t,i)=>{const [sign,kind,ownerV,a,b,c,md]=t;const mag=this.integerBig(`process-hash-${i}`,'1000000000000000000','9000000000000000000');const ph=mag*BigInt(sign);const owner=ownerV==null?uid:ownerV;const metric=this.reqInt(`process-metric-${i}`,cur,10**(md-1),10**md-1);return `${ph}:${kind}:${owner}_${a}_${b}_${c}_${metric}`;});
    const iid=this.hex('interface-id',3);
    const net=`8,eth0;69699;3;fe80::5054:ff:fe${iid.slice(0,2)}:${iid.slice(2)};fec0::5054:ff:fe${iid.slice(0,2)}:${iid.slice(2)};10.0.2.15,dummy0;65731;1;fe80::8c95:a4ff:fe59:322`;
    const lat=this.reqInt('collection-latency',cur,8000,16000);
    const v={};for(const k of Object.keys(REF_NATIVE))v[k]=String(REF_NATIVE[k]);
    Object.assign(v,{16:id.android_id,17:ictx,26:this.hex('native-device-id',16),34:`C:1,T:${cur},LT:${lat}`,125:pe.join(','),126:String(boot),129:net,141:String(this.integer('native-property-141',1000000,9999999)),146:'1,272494655,eth0,10.0.2.15,10.0.2.3',148:id.oaid});
    return v;}
  featureMap(cur,code,nonce){const id=this.identity();const n=this.nativeMap(cur);const st=[0,1,2].map(i=>this.reqInt(`stage-${i}`,cur,1000,2200));
    return {1:id.channel,4:this.javaPerf(cur),205:n[22],210:n[34],240:n[44],250:n[100],251:n[101],252:n[102],253:n[103],254:n[104],255:n[105],256:n[106],257:n[107],258:n[113],259:n[114],264:n[24],266:n[45],267:n[17],268:n[115],269:n[116],270:n[117],271:n[46],272:n[118],273:'',279:n[120],280:n[122],281:n[126],282:n[138],284:n[146],285:n[149],286:n[150],287:n[151],288:n[152],303:`5_1_${code}_${st.join('_')}`,308:'1',309:'',402:'',406:'',2001:n[200],2005:'0',2013:JAVA_CONST['2013'],2016:JAVA_CONST['2016'],2017:JAVA_CONST['2017'],2018:String(this.integer('uid',10000,19999)),2019:n[133],2021:n[140],2029:'0',3001:String(code),3002:'1',3004:nonce,3005:'1'};}
}
function hashTags(entries,ts){const parts=entries.map(([,v])=>String(v));let st=BigInt(ts);for(let i=0;i<Math.floor((entries.length+3)/4);i++){st=((st*214013n+2531011n)>>16n)&0x7FFFn;parts.push(st.toString(16));}const d=turingHash64(u8(parts.join('')),0).toString(16);return ['01'+d,d];}
function buildM90(p,ts,nonce){const code=-22056;const id=p.identity();const f=p.featureMap(ts,code,nonce);const nm=p.nativeMap(ts);
  const nested=Object.keys(nm).map(k=>[Number(k),nm[k]]).sort((a,b)=>a[0]-b[0]);
  const [t10,t12]=hashTags(nested,ts);const uid=f[2018];const proc=`${id.package_name}:tools,${uid},untrusted_app,${uid},,init`;
  const o=new Jce();o.int64(0,ts);
  const meta=new Jce();meta.int32(0,90);meta.string(1,'90');meta.string(2,BUILD_MARKER);meta.string(3,CHANNEL);meta.int32(4,2);o.struct(1,meta.finish());
  o.mapIntStr(2,nested);
  const net=new Jce();net.string(0,'3.2.3,113');net.string(1,id.package_name);o.struct(3,net.finish());
  o.mapIntStr(5,[[3,f[303]],[8,f[308]],[9,f[309]],[7,proc],[10,t10],[12,t12],[4,p.directPerf(ts)]]);
  o.mapIntStr(6,[[2,'']]);
  const tail=new Jce();tail.string(0,'');tail.string(2,'');tail.int32(3,0);tail.string(4,'');tail.string(5,'');o.struct(8,tail.finish());
  const nb=o.finish();
  const w=new Jce();w.mapIntStr(0,[[2,id.model],[1,id.brand],[3,id.channel],[4,id.package_name]]);w.int64(1,ts);w.int32(2,1);w.struct(4,nb);w.int32(5,code);w.string(6,String(code));w.string(7,nonce);
  return {m90:w.finish(),nested:nb,tags:[t10,t12]};}
const ALNUM='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function randStr(n,alpha=ALNUM){const r=randomBytes(n*2);let s='';for(let i=0;i<n;i++)s+=alpha[((r[i*2]<<8)|r[i*2+1])%alpha.length];return s;}
function deviceToken(p,ts){const nonce=randStr(32);const {m90}=buildM90(p,ts,nonce);const key=u8(randStr(16));const comp=zlibCompressStored(concat(new Uint8Array([2]),m90));const cipher=xxteaEncrypt(comp,key);return {token:'v3:'+b64(concat(new Uint8Array([1]),rsaEncrypt(key),cipher)),time:String(ts).slice(0,10),ts};}
function appGuid(p){const a='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';return Array.from(p.bytes('app-guid',60)).map(v=>a[v%62]).join('');}

/* ===== 国网 App 接口 ===== */
const SG_BASE = 'https://csc-service.sgcc.com.cn:28630/';
const SERVER_PUB = '0409C10D38CF7B4E28097EAAA519E3157C9B4E72194CD13BD11932CE40ED5624AFEFF27F78893E4C4FC2029DA147AB6CEAE0CDC8E3A547EFCDC5AB91757FE1CA60';
const CLIENT_PRIV = '50C4AF48DF75808050729977AA6BC127DC21A404755C660B94222F9D50FA4A75';
const P_LOGIN = 'emss-uia-center-front/member/c2/f01';
const P_SMS = 'emss-uia-center-front/member/c1/f01';
const P_DAILY = 'emss-bia-bill-front/member/c11/f01';
const P_MONTH = 'emss-bia-bill-front/member/c51/f04';
const P_BAL = 'emss-bia-balance-front/member/c16/f01';
const CHECK_KEY = 'LNPO+ISJ+QeqNemFK+3OMUdexSn2i6pB';

class SgError extends Error { constructor(code, msg) { super(msg ? `${msg}` : code); this.code = String(code || ''); } }

function cnNow() { const d = new Date(Date.now() + 8 * 3600000); const p = (n, l = 2) => String(n).padStart(l, '0'); return { s14: `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`, ms: p(d.getUTCMilliseconds(), 3), y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; }
function reqTimestamp() { const n = cnNow(); return n.s14 + n.ms + randStr(6, '0123456789'); }
function appGuidNew() { const n = cnNow(); return randStr(40, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') + n.s14 + n.ms + String(100 + (randomBytes(2)[0] * 256 + randomBytes(1)[0]) % 900); }

function javaHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0; return h; }
function hashMapOrder(v) {
  if (Array.isArray(v)) return v.map(hashMapOrder);
  if (v && typeof v === 'object') {
    const buckets = {};
    Object.keys(v).forEach((k) => { let h = javaHash(k); h = (h ^ (h >>> 16)) >>> 0; const b = h & 15; (buckets[b] = buckets[b] || []).push(k); });
    const o = {};
    Object.keys(buckets).map(Number).sort((a, b) => a - b).forEach((b) => buckets[b].forEach((k) => { o[k] = hashMapOrder(v[k]); }));
    return o;
  }
  return v;
}
function loginMd5(params) { return md5hex(Object.keys(params).sort().map((k) => k + JSON.stringify(hashMapOrder(params[k]))).join('')); }

function checkCode(account) {
  let r = 0n; const rb = randomBytes(8); for (const b of rb) r = (r << 8n) | BigInt(b); r &= (1n << 63n) - 1n;
  return String(r).padStart(24, '0') + toHex(aes256EcbEncrypt(u8(`${account}${Date.now()}`), u8(CHECK_KEY)));
}
function uscInfo(dev) { return { isEncrypt: 'false', devciceIp: '127.0.0.1', devciceId: '000000', tenant: 'state_grid', member: '2202', optSys: 'Android 13', operatorType: '', devciceName: 'sdk_gphone64_arm64', pushId: '000000,000000' }; }
function loginParams(account, password, code, codeKey) {
  return {
    quInfo: { code: code || '', codeKey: codeKey || '', account, password: md5hex(password), optSys: 'Android', pushId: '000000,000000', addressCity: '', addressProvince: '', addressRegion: '' },
    uscInfo: uscInfo(),
    checkCode: checkCode(account),
    avalonValidCode: '',
  };
}

class SgApp {
  constructor(ctx, user, pass) { this.ctx = ctx; this.user = clean(user).replace(/^(\+?86)?\s*/, '').replace(/\D/g, ''); this.pass = clean(pass); this.policy = clean((ctx.env || {}).SGCC_POLICY) || 'DIRECT'; this.dev = null; this.sess = null; }
  sk(base) { return uk(base, this.user); }
  st(k, v) { try { if (v === undefined) return this.ctx.storage.getJSON(k); this.ctx.storage.setJSON(k, v); } catch (_) { return null; } return null; }
  device() {
    if (this.dev) return this.dev;
    let s = this.st(K.dev);
    if (!s || !s.seed) {
      const now = Date.now();
      const boot = now - 3600000 - Math.floor(Math.random() * (86400000 * 14 - 3600000));
      s = { seed: b64(randomBytes(32)), boot, install: boot - 86400000 - Math.floor(Math.random() * 86400000 * 179) };
    }
    const prof = new Profile(b64dec(s.seed), s.boot, s.install);
    if (!s.tok || Date.now() - s.tok.ts > 4 * 3600000) s.tok = deviceToken(prof, Date.now());
    this.st(K.dev, s);
    this.dev = { s, guid: appGuid(prof) };
    return this.dev;
  }
  headers(loginP, authed) {
    const d = this.device();
    const h = {
      'Content-Type': 'application/json; charset=UTF-8',
      timeStamp: loginP ? cnNow().s14 : reqTimestamp(),
      t: authed ? this.sess.token : '',
      userid: authed ? this.sess.userId : '0',
      AppGuid: d.guid, AppGuidNew: appGuidNew(), security: 'android', appcode: 'WSGW-SG1001-APP', datacenter: '99', AccessMethod: 'App',
      deviceTokenTX: d.s.tok.token, deviceTokenTXTime: d.s.tok.time,
      province: authed ? (this.sess.province || '') : '',
      version: '3.2.3', wsgwType: 'android', ip: '127.0.0.1', os: 'android', 'User-Agent': 'okhttp/3.14.9',
    };
    if (loginP) h.md5 = loginMd5(loginP);
    return h;
  }
  async post(path, payload, { authed = false, loginP = null } = {}) {
    const key = toHex(randomBytes(16));
    const ts = String(Date.now());
    const data = sm4EncryptHex(JSON.stringify(payload), key);
    const skey = sm2EncryptKey(key, SERVER_PUB);
    const body = JSON.stringify({ data, sign: sm3hex(skey + data + ts), skey, timestamp: ts });
    const req = { headers: this.headers(loginP, authed), body, timeout: 20000 };
    if (this.policy) req.policy = this.policy;
    let text;
    try { const r = await this.ctx.http.post(SG_BASE + path, req); text = await r.text(); if (r.status >= 500) throw new Error('HTTP ' + r.status); }
    catch (e) { throw new SgError('net', '连不上国网服务器：' + ((e && e.message) || e)); }
    let outer; try { outer = JSON.parse(text); } catch (_) { throw new SgError('net', '国网返回了无法识别的内容'); }
    if (!outer.respKey || !outer.encryptData) throw new SgError(outer.code || 'net', outer.message || '国网返回异常');
    const k2 = utf8dec(sm2DecryptKey(String(outer.respKey), CLIENT_PRIV));
    return JSON.parse(utf8dec(sm4DecryptHex(String(outer.encryptData), k2)));
  }
  static check(resp) {
    const top = String(resp.code == null ? '' : resp.code);
    const d = resp.data && typeof resp.data === 'object' ? resp.data : {};
    const srv = d.srvrt && typeof d.srvrt === 'object' ? d.srvrt : null;
    const code = srv ? String(srv.resultCode || '') : top;
    const msg = (srv && srv.resultMessage) || resp.message || '';
    if (srv && code && code !== '0000') throw new SgError(code, msg);
    if (!srv && top && top !== '1') throw new SgError(top, msg);
    return d;
  }
  async login(code, codeKey) {
    const p = loginParams(this.user, this.pass, code, codeKey);
    const resp = await this.post(P_LOGIN, p, { loginP: p });
    const d = SgApp.check(resp);
    const biz = d.bizrt || {};
    if (!biz.token) throw new SgError('auth', '登录没有返回凭证');
    let ui = biz.userInfo; if (Array.isArray(ui)) ui = ui.find((x) => x && typeof x === 'object') || {}; ui = ui || {};
    const life = Number(biz.tokenExpireTime) || 1296000;
    this.sess = { user: this.user, token: String(biz.token), userId: String(ui.userId || biz.userId || '0'), province: clean(ui.addressProvince), exp: Date.now() + Math.max(300, life) * 1000, accounts: (Array.isArray(ui.powerUserList) ? ui.powerUserList : []).map(acctOf).filter(Boolean) };
    this.st(this.sk(K.sess), this.sess);
    return this.sess;
  }
  async sendDeviceSms() {
    const resp = await this.post(P_SMS, { uscInfo: { tenant: 'state_grid', member: '2202', devciceId: '000000', devciceName: 'sdk_gphone64_arm64', devciceIp: '127.0.0.1' }, quInfo: { voiceCodeFlag: false, account: this.user, sendType: 0, businessType: 'logindevice' } });
    const d = SgApp.check(resp);
    const ck = d.bizrt && d.bizrt.codeKey;
    if (!ck) throw new SgError('sms', '验证码发送失败');
    return String(ck);
  }
  async ensure() {
    let s = this.st(this.sk(K.sess));
    if (!s || !s.token) { const o = this.st(K.sess); if (o && o.user === this.user) s = o; }
    if (s && s.user === this.user && s.token && s.exp > Date.now() + 300000) { this.sess = s; return s; }
    const env = this.ctx.env || {};
    const sms = clean(env.SGCC_SMS).replace(/\D/g, '');
    const pend = this.st(this.sk(K.sms));
    const pendOk = pend && pend.user === this.user && Date.now() - pend.ts < 15 * 60000;
    if (pendOk && sms.length === 6 && sms !== pend.used) {
      this.st(this.sk(K.sms), { ...pend, used: sms });
      return this.login(sms, pend.codeKey);
    }
    try { return await this.login(); }
    catch (e) {
      const codeStr = String((e && e.code) || '');
      const msgStr = String((e && e.message) || '');
      const isSmsRequired = codeStr === '4006' || codeStr.includes('4006') ||
                            codeStr === 'RK007' || codeStr === 'RK008' || codeStr === 'RK1003' ||
                            /验证码|新设备|短信|超时\(RK007\)|安全验证|RK00/i.test(msgStr);
      if (!isSmsRequired) throw e;
      // 超过60秒允许重新触发下发短信验证码
      if (!pendOk || Date.now() - pend.ts > 60 * 1000) {
        try {
          const codeKey = await this.sendDeviceSms();
          this.st(this.sk(K.sms), { user: this.user, codeKey, ts: Date.now(), used: sms });
          console.log(`[SGCC] 安全验证码已成功触发下发到手机号: ${this.user}`);
        } catch (smsErr) {
          console.error(`[SGCC] 下发验证码接口异常: ${smsErr.message || smsErr}`);
          throw new SgError('sms_fail', `触发短信验证码失败：${smsErr.message || '国网短信网关繁忙，请稍后重试'}`);
        }
      }
      throw new SgError('4006', `国网新设备安全验证：短信验证码已发至 ${this.user.slice(0, 3)}****${this.user.slice(-4)}，请在小组件「账户设置」中填入6位验证码并刷新！`);
    }
  }
  async authed(path, payload) {
    await this.ensure();
    for (let i = 0; i < 2; i++) {
      const resp = await this.post(path, payload, { authed: true });
      try { return SgApp.check(resp); }
      catch (e) {
        if (!['-200', '-201'].includes(e.code) || i) throw e;
        this.st(this.sk(K.sess), {}); this.sess = null; await this.ensure();
      }
    }
    return {};
  }
}

function acctOf(v) {
  if (!v || typeof v !== 'object') return null;
  const f = (...ks) => { for (const k of ks) if (v[k] != null && v[k] !== '') return String(v[k]); return ''; };
  const consNo = f('powerUserNo', 'consNo');
  if (!consNo) return null;
  const src = f('powerUserNo_dst', 'consNo_dst') || consNo;
  return { consNo, src, pro: f('proNo', 'provinceId'), org: f('orgNo'), elec: f('elecType', 'constType'), name: f('consName', 'userName', 'nickname'), orgName: f('orgName') };
}
function consType(a) { return a.elec === '04' || (a.elec === '02' && a.pro === '11102') ? '02' : '01'; }
function ymd(y, m, d) { return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
function monthRange(y, m) { return [ymd(y, m, 1), ymd(y, m, new Date(Date.UTC(y, m, 0)).getUTCDate())]; }


async function queryAccount(app, a) {
  const n = cnNow();
  const daily = [];
  let monthTotal = NaN;
  for (let off = 0; off < 2; off++) {
    let y = n.y, m = n.m - off; if (m < 1) { m += 12; y -= 1; }
    const [s, e] = monthRange(y, m);
    try {
      const d = await app.authed(P_DAILY, { serviceCode: 'BCP_000026', source: 'app', target: a.pro, data: { acctId: 'acctid01', channelCode: 'SGAPP', consNo: a.src, consNosrc: a.src, endTime: e, consType: consType(a), funcCode: 'ALIPAY_01', orgNo: a.org, proCode: a.pro, promotCode: '1', promotType: '1', serialNo: '', srvCode: '', startTime: s, userName: 'acctid01' } });
      (Array.isArray(d.sevenEleList) ? d.sevenEleList : []).forEach((x) => {
        const dStr = String(x.day || '').replace(/\D/g, '');
        daily.push({ day: dStr, dayElePq: x.dayElePq });
      });
      if (off === 0) monthTotal = num(d.totalPq);
    } catch (e) { if (off === 0 && !daily.length) throw e; }
  }
  let bills = [], yearPq = NaN, yearAmt = NaN;
  for (const y of [n.y, n.y - 1]) {
    try {
      const d = await app.authed(P_MONTH, { serviceCode: 'BCP_000026', source: 'app', target: a.pro, data: { year: y, consNo: a.src, provinceCode: a.pro, startYm: `${y}01`, endYm: `${y}12`, funcCode: 'ALIPAY_01' } });
      const raw = Array.isArray(d.list) ? d.list : Array.isArray(d.mothEleList) ? d.mothEleList : Array.isArray(d.monthEleList) ? d.monthEleList : [];
      const list = raw.map((x) => {
        const ele = Array.isArray(x.eleList) ? x.eleList : [];
        let use = num(x.monthPq != null ? x.monthPq : x.monthEleNum != null ? x.monthEleNum : x.pq != null ? x.pq : x.totalPq);
        if (!Number.isFinite(use) && ele.length) use = ele.reduce((s, i) => s + (num(i.pq) || 0), 0);
        let cost = num(x.monthAmt != null ? x.monthAmt : x.monthEleCost != null ? x.monthEleCost : x.amt);
        if (!Number.isFinite(cost) && ele.length) cost = ele.reduce((s, i) => s + (num(i.amt) || 0), 0);
        return { month: clean(x.ym || x.month).replace(/\D/g, '').slice(0, 6), monthEleNum: use, monthEleCost: cost };
      }).filter((x) => x.month.length === 6);
      if (y === n.y) { yearPq = num(d.yearPq); yearAmt = num(d.yearAmt); if (!Number.isFinite(yearPq) && list.length) yearPq = list.reduce((s, x) => s + (x.monthEleNum || 0), 0); if (!Number.isFinite(yearAmt) && list.length) yearAmt = list.reduce((s, x) => s + (x.monthEleCost || 0), 0); }
      bills = list.concat(bills);
      if (list.length && y === n.y && n.m > 1) break;
    } catch (e) { if (['-200', '-201', '4006', 'RK008'].includes(e.code)) throw e; break; }
  }
  let bal = null;
  try {
    const d = await app.authed(P_BAL, { serviceCode: '0101143', source: 'app', target: a.pro, data: { srvCode: '', serialNo: '', channelCode: '0902', funcCode: 'A1007200', acctId: app.sess.userId, userName: 'acctid01', promotType: '1', promotCode: '1', userAccountId: app.sess.userId, list: [{ consNoSrc: a.src, proCode: a.pro, sceneType: a.elec, consNo: a.consNo, orgNo: a.org }] } });
    bal = (Array.isArray(d.list) ? d.list : []).find((x) => x && typeof x === 'object') || null;
  } catch (e) { if (['-200', '-201', '4006', 'RK008'].includes(e.code)) throw e; }
  
  let sumMoney = NaN, owe = 0;
  if (bal) {
    const sm = num(bal.sumMoney), ab = num(bal.accountBalance), pb = num(bal.prepayBal);
    if (String(bal.consType) === '1') sumMoney = Number.isFinite(sm) ? sm : pb;
    else if (sm > 0) { sumMoney = -sm; owe = sm; }
    else sumMoney = ab > 0 ? ab : pb > 0 ? pb : (Number.isFinite(sm) ? 0 : NaN);
    if (num(bal.historyOwe) > 0) owe = num(bal.historyOwe);
  }

  const isPostPaid = bal && String(bal.consType) !== '1';
  const eleBill = {
    sumMoney: Number.isFinite(sumMoney) ? sumMoney : 0,
    historyOwe: owe,
    prepayBal: bal ? num(bal.prepayBal) : NaN,
    date: bal ? clean(bal.date || bal.amtTime) : ''
  };
  if (isPostPaid) {
    eleBill.accountBalance = bal && Number.isFinite(num(bal.accountBalance)) ? num(bal.accountBalance) : 0;
  }

  return {
    userInfo: { consNo: a.consNo, consNo_dst: a.src, consName_dst: a.name, orgName: a.orgName, proNo: a.pro },
    arrearsOfFees: owe > 0,
    eleBill,
    dayElecQuantity31: { sevenEleList: daily },
    monthElecQuantity: { mothEleList: bills, dataInfo: { totalEleNum: yearPq, totalEleCost: yearAmt } },
    monthTotal,
  };
}

  return { SgApp, queryAccount, SgError, K, md5hex };
})();
const md5hex = SgccProtocol.md5hex;



class Widget extends DmYY {
  constructor(arg) {
    super(arg);
    this.name = '国家电网';
    this.en = 'wsgw_ng';
    this.index = 0;
    this.data = null;
    this.fm = (this.settings && this.settings.useICloud === 'true') ? FileManager.iCloud() : FileManager.local();
    this.cachePath = this.fm.joinPath(this.fm.documentsDirectory(), this.CACHE_FOLDER || Script.name());
    this.Run();
  };

  version = '2.3.5';

  fm = FileManager.local();
  CACHE_FOLDER = Script.name();
  cachePath = FileManager.local().joinPath(FileManager.local().documentsDirectory(), Script.name());

  getCachePath() {
    const isCloud = this.settings && this.settings.useICloud === 'true';
    const fm = isCloud ? FileManager.iCloud() : FileManager.local();
    return fm.joinPath(fm.documentsDirectory(), this.CACHE_FOLDER || Script.name());
  }

  isOverdue = false;
  isPostPaid = false;
  remainFee = 0;
  balance = 0;
  monthUsage = 0;
  monthFee = 0;
  yearUsage = 0;
  yearFee = 0;
  dayFee = 0;
  stepEle = 0;
  currentMonthEle = 0;
  SCALE = 1;
  barHeight = 12;
  update = this.formatDate();
  smallStackColor = '#3A9690';
  endColor = '#3A9690';
  lastColor = '#00CC99'
  widgetStyle = '1';
  
  dayElePq = [];
  monthElePq = [];
  
  size = {
    logo : 48 * 0.95,
    leftStack : 130 * 0.95,
    smallFont : 12 * 0.95,
    bigFont : 18 * 0.95,
    balance : 20 * 0.95,
    subSpacer : 6.5 * 0.95,
  };
  
  wsgw = {
    step_2 : 2520,
    step_3 : 4800,
    interval : 360,
  };

  setRow(stack, key) {
    const itemStack = stack.addStack();
    switch (key) {
      case '组合一' :
      this.rowUnit(itemStack, this.settings.group1Left || '上期电费');
      itemStack.addSpacer();
      this.rowUnit(itemStack, this.settings.group1Right || '上期电量', true);
      break;
      case '组合二' :
      this.rowUnit(itemStack, this.settings.group2Left || '年度电费');
      itemStack.addSpacer();
      this.rowUnit(itemStack, this.settings.group2Right || '年度电量', true);
      break;
      case '组合三' :
      this.rowUnit(itemStack, this.settings.group3Left || '近日用电');
      itemStack.addSpacer();
      this.rowUnit(itemStack, this.settings.group3Right || '本月电量', true);
      break;
      case '阶梯电量':
      this.stepEleStack(itemStack);
      default:
      return;
    }
  };

  getWidgetData(key) {
    switch (key) {
      case '上期电费' :
      return [key, `${this.monthFee}`, '元'];
      case '上期电量' :
      return [key, `${this.monthUsage}`, '度'];
      case '年度电费':
      return [key, `${this.yearFee}`, '元'];
      case '年度电量':
      return [key, `${this.yearUsage}`, '度'];
      case '本月电量':
      return [key, `${this.currentMonthEle}`, '度'];
      case '近日用电':
      const arr = this.dayElePq.map((item) => item.elePq).reverse();
      this.dayFee = arr[arr.length - 1] || 0;
      return [key, `${this.dayFee}`, '度'];
      case '电费余额':
      return [key, `${this.remainFee}`, '元'];
      case '阶梯电量':
      return key;
      case '自定户名':
      return key;
      default:
      return null;
    }
  };
  
  rowUnit(stack, key, right = false){
    const bodyStack = stack.addStack();
    bodyStack.layoutVertically();
    const h = this.size.smallFont + this.size.bigFont + 3;
    const scale = h / 50;
    switch (key) {
      case '上期电费' :
      this.unitContent(bodyStack, '上期电费', `${this.monthFee}`, true, right);
      break;
      case '上期电量' :
      this.unitContent(bodyStack, '上期电量', `${this.monthUsage}`,false, right);
      break;
      case '年度电费':
      this.unitContent(bodyStack, '年度电费', `${this.yearFee}`, true, right);
      break;
      case '年度电量':
      this.unitContent(bodyStack, '年度电量', `${this.yearUsage}`, false, right);
      break;
      case '本月电量':
      this.unitContent(bodyStack, '本月电量', `${this.currentMonthEle}`, false, right);
      break;
      case '近日用电':
      const arr = this.dayElePq.map((item) => item.elePq).reverse();
      this.dayFee = arr[arr.length - 1] || 0;
      this.unitContent(bodyStack, '近日用电', `${this.dayFee}`, false, right);
      break;
      case '电费余额':
      this.unitContent(bodyStack, '电费余额', `${this.remainFee}`, true, right);
      break;
      case '日用电图表':
      if (!this.data[this.index]) return;
      const dayAmount = parseFloat(this.settings.dayAmount) || 5;
      const dayOpt = this.dayElePq.map((item) => item.elePq).reverse();
      if (dayOpt.every(num => num === 0)) return;
      const result = [...dayOpt].slice(-dayAmount);
      if (result.every(num => num === 0)) return;
      const dayChart = bodyStack.addImage(this.chartBar(dayOpt, dayAmount));
      dayChart.imageSize = new Size((dayAmount * 18 - 10) * scale, 50 * scale);
      break;
      case '月用电图表':
      if (!this.data[this.index]) return;
      const monthAmount = parseFloat(this.settings.monthAmount) || 5;
      const monthOpt = this.monthElePq.map((item) => item.cost);
      if (monthOpt.every(num => num === 0)) return;
      const monthChart = bodyStack.addImage(this.chartBar(monthOpt, monthAmount));
      monthChart.imageSize = new Size((monthAmount * 18 - 10) * scale, 50 * scale);
      break;
      case '不显示':
      return;
      default:
      return;
    }
  };
  
  unitContent(stack, upText, downText, fee = false, right = false) {
    const titleStack = stack.addStack();
    if (right) titleStack.addSpacer();
    const smallText = titleStack.addText(upText);
    const valueStack = stack.addStack();
    if (right) valueStack.addSpacer();
    const bigText = valueStack.addText(downText);
    fee ? this.unit(valueStack, '元', this.size.subSpacer) : this.unit(valueStack, '度', this.size.subSpacer);
    smallText.textColor = this.widgetColor;
    smallText.font = Font.semiboldSystemFont(this.size.smallFont);
    smallText.textOpacity = 0.5;
    bigText.textColor = this.widgetColor;
    bigText.font = Font.mediumRoundedSystemFont(this.size.bigFont)
  };

  // 阶梯电量Stack
  stepEleStack(stack) {
    stack.layoutVertically();
    const textStack = stack.addStack();
    const leftTitle = textStack.addText('阶梯电量');
    textStack.addSpacer();
    const step = this.stepEleText();
    const rightTitle = textStack.addText(step.text);
    stack.addSpacer(4);
    stack.addImage(this.progressBar());

    leftTitle.textColor = this.widgetColor;
    rightTitle.textColor = step.color;
    [leftTitle, rightTitle].map(t => {
      t.font = Font.semiboldSystemFont(this.size.smallFont);
      t.textOpacity = 0.5
    });
  };

  // 阶梯电量状态文本
  stepEleText() {
    let step = {
      text: '一档·0%',
      color: this.widgetColor,
      progress: 0,
      icon: '1.square',
      level: 1
    };
    
    const isMonthly = this.settings.stepMode === '月';

    const currentUsage = parseFloat(this.currentMonthEle);
    const totalUsage = parseFloat(this.stepEle);

    const per_step_1 = isMonthly
      ? ((currentUsage / this.wsgw.step_2) * 100).toFixed(2)
      : ((totalUsage / this.wsgw.step_2) * 100).toFixed(2);

    const per_step_2 = isMonthly
      ? ((currentUsage / this.wsgw.step_3) * 100).toFixed(2)
      : ((totalUsage / this.wsgw.step_3) * 100).toFixed(2);

    if ((isMonthly && currentUsage < this.wsgw.step_2) || (!isMonthly && totalUsage < this.wsgw.step_2)) {
      step = {
        text: `第一阶梯·${per_step_1}%`,
        color: this.widgetColor,
        progress: `${per_step_1}%`,
        icon: '1.square',
        level: 1
      };
    } else if ((isMonthly && currentUsage > this.wsgw.step_3) || (!isMonthly && totalUsage > this.wsgw.step_3)) {
      const per_step_3 = (per_step_2 - 100).toFixed(2);
      step = {
        text: `第三阶梯·${per_step_3}%`,
        color: new Color('#DE2A18'),
        progress: `${per_step_3}%`,
        icon: '3.square',
        level: 3
      };
    } else {
      step = {
        text: `第二阶梯·${per_step_2}%`,
        color: this.widgetColor,
        progress: `${per_step_2}%`,
        icon: '2.square',
        level: 2
      };
    }

    return step;
  };

  // 单位
  unit(stack, text, spacer, corlor = this.widgetColor, overDue = false) {
    stack.addSpacer(1);
    const unitStack = stack.addStack();
    unitStack.layoutVertically();
    unitStack.addSpacer(spacer);
    const unitTitle = unitStack.addText(text);
    unitTitle.font = Font.semiboldRoundedSystemFont(10 * this.SCALE);
    unitTitle.textColor = overDue ? new Color('DE2A18') : corlor;
  };

  addChineseUnit(stack, text, color, size) {
    let textElement = stack.addText(text);
    textElement.textColor = color;
    textElement.font = Font.mediumSystemFont(size);
    return textElement;
  };

  // 分栏
  split(stack, width, height, ver = false) {
    const splitStack = stack.addStack();
    splitStack.size = new Size(width, height);
    if (ver) splitStack.layoutVertically();
    splitStack.addSpacer();
    splitStack.backgroundColor = Color.dynamic(new Color('#B6B5BA'), new Color('#414144'));
  };
  // 标题
  setTitle (stack, iconColor, nameColor) {
    const nameStack = stack.addStack();
    const iconSFS = SFSymbol.named('house.fill');
    iconSFS.applyHeavyWeight();
    let icon = nameStack.addImage(iconSFS.image);
    icon.imageSize = new Size(20 * this.SCALE, 20 * this.SCALE);
    icon.tintColor = iconColor;
    nameStack.addSpacer(2);
    let name = nameStack.addText(this.name || '国家电网');
    name.font = Font.mediumSystemFont(16.5 * this.SCALE);
    name.textColor = nameColor;
  };
  
  setList(stack, data, color) {
    const rowStack = stack.addStack();
    rowStack.centerAlignContent();
    const lineStack = rowStack.addStack();
    lineStack.size = new Size(8 * this.SCALE, 30 * this.SCALE); 
    lineStack.cornerRadius = 4 * this.SCALE;
    
    lineStack.backgroundColor = new Color(color);

    rowStack.addSpacer(10 * this.SCALE);

    const leftStack = rowStack.addStack();
    leftStack.layoutVertically();
    leftStack.addSpacer(2 * this.SCALE);

    const titleStack = leftStack.addStack();
    const title = titleStack.addText(data[0]);
    title.font = Font.systemFont(10 * this.SCALE); 
    title.textColor = this.widgetColor;
    title.textOpacity = 0.5;

    const valueStack = leftStack.addStack();
    valueStack.centerAlignContent();
    const value = valueStack.addText(data[1]);
    value.font = Font.semiboldRoundedSystemFont(16 * this.SCALE);
    value.textColor = this.widgetColor;
    valueStack.addSpacer();

    const unitStack = valueStack.addStack();
    unitStack.cornerRadius = 4 * this.SCALE;
    unitStack.borderWidth = 1;
    unitStack.borderColor = new Color(color);
    unitStack.setPadding(1, 3 * this.SCALE, 1, 3 * this.SCALE);
    unitStack.size = new Size(30 * this.SCALE, 0)
    unitStack.backgroundColor = Color.dynamic(new Color(color), new Color(color, 0.3));
    const unit = unitStack.addText(data[2]);
    unit.font = Font.mediumRoundedSystemFont(10 * this.SCALE);
    unit.textColor = Color.dynamic(Color.white(), new Color(color));
  };
  
  // 更新时间
  setUpdateStack (stack, color) {
    const updateStack = stack.addStack();
    updateStack.addSpacer();
    updateStack.centerAlignContent();
    const updataIcon = SFSymbol.named('arrow.2.circlepath');
    updataIcon.applyHeavyWeight();
    const updateImg = updateStack.addImage(updataIcon.image);
    updateImg.tintColor = color;
    updateImg.imageOpacity = 0.5;
    updateImg.imageSize = new Size(10, 10);
    updateStack.addSpacer(3);
    const updateText = updateStack.addText(this.getTime());
    updateText.font = Font.mediumSystemFont(10);
    updateText.textColor = color;
    updateText.textOpacity = 0.5;
    updateStack.addSpacer();
  };
  
  // 余额
  setBalanceStack (stack, color, padding, balanceSize, titleSize, spacer) {
    let balance = this.balance;
    let balanceTitle = this.isOverdue ? '电费欠费' : '电费余额';
    if (!this.isOverdue && this.isPostPaid) {
      balance = this.settings.showBalance === 'true' ? this.remainFee : this.monthFee;
      balanceTitle = this.settings.showBalance === 'true' ? '电费余额' : '上期电费';
    };
    
    const bodyStack = stack.addStack();
    bodyStack.layoutVertically();
    bodyStack.cornerRadius = 10;
    bodyStack.backgroundColor = color;
    bodyStack.addSpacer(padding * this.SCALE);
    //  余额Stack
    const balanceStack = bodyStack.addStack();
    balanceStack.centerAlignContent();
    balanceStack.addSpacer();
    const balanceText = balanceStack.addText(`${balance}`);
    balanceText.font = Font.semiboldRoundedSystemFont(balanceSize);
    balanceText.lineLimit = 1;
    balanceText.minimumScaleFactor = 0.5;
    balanceText.textColor = this.isOverdue ? new Color('DE2A18') : this.widgetColor;
    this.unit(balanceStack, "元", spacer * this.SCALE, this.widgetColor, this.isOverdue);
    balanceStack.addSpacer();
    bodyStack.addSpacer(3 * this.SCALE);
    //  余额标题Stack
    const balanceTitleStack = bodyStack.addStack();
    balanceStack.url = "com.wsgw.e.zsdl://platformapi/";
    balanceTitleStack.addSpacer();
    const balanceTitleText = balanceTitleStack.addText(balanceTitle);
    balanceTitleStack.addSpacer();
    bodyStack.addSpacer(padding * this.SCALE);

    balanceTitleText.textColor =  this.isOverdue ? new Color('DE2A18') : this.widgetColor;
    balanceTitleText.font =  Font.semiboldSystemFont(titleSize);
    balanceTitleText.textOpacity = 0.5;
  };

  getLogo = async () => {
    try {
      if (this.settings.logoImg === '不显示') {
        let context = new DrawContext();
        context.size = new Size(1, 1);
        context.opaque = false; context.setFillColor(new Color('#FFFFFF', 0));
        context.fillRect(new Rect(0, 0, 1, 1)); 
        return context.getImage();
      }
      if (this.settings.logoImg === '铁塔') {
        try {
          return Image.fromData(Data.fromBase64String('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'));
        } catch (_) {}
      }
      if (this.settings.customizeUrl && this.settings.logoImg === '自定义') {
        try {
          return await this.getImageByUrl(this.settings.customizeUrl, 'customize.png');
        } catch (_) {}
      }
      // 默认国家电网高精 Logo：直接读取内嵌 Base64，免受 GitHub 网络阻断影响
      return Image.fromData(Data.fromBase64String('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'));
    } catch (e) {
      console.error('Logo 加载异常: ' + (e.message || e));
      let context = new DrawContext();
      context.size = new Size(1, 1);
      context.opaque = false; context.setFillColor(new Color('#FFFFFF', 0));
      context.fillRect(new Rect(0, 0, 1, 1)); 
      return context.getImage();
    }
  };
  // ######################################
  // ######################################
  // 画画的BABY
  makeCanvas(w, h) {
    const drawing = new DrawContext();
    drawing.opaque = false;
    drawing.respectScreenScale = true;
    drawing.size = new Size(w, h);
    return drawing;
  };
  
  fillRect(drawing, x, y, width, height, cornerradio, color) {
    let path = new Path();
    let rect = new Rect(x, y, width, height);
    path.addRoundedRect(rect, cornerradio, cornerradio);
    drawing.addPath(path);
    drawing.setFillColor(color);
    drawing.fillPath();
  };
  
  drawLine(drawing, x1, y1, x2, y2, color, width) {
    const path = new Path();
    path.move(new Point(Math.round(x1),Math.round(y1)));
    path.addLine(new Point(Math.round(x2),Math.round(y2)));
    drawing.addPath(path);
    drawing.setStrokeColor(color);
    drawing.setLineWidth(width);
    drawing.strokePath();
  };
  
  drawArc(context, center, radius, startAngle, endAngle, segments, fillColor, lineWidth, dir = 1) {
    const path = new Path();
    const startX = center.x + radius * Math.cos(startAngle);
    const startY = center.y + radius * Math.sin(startAngle);
    path.move(new Point(startX, startY));

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const angle = startAngle + (endAngle - startAngle) * t;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      path.addLine(new Point(x, y));
    }

    context.setStrokeColor(fillColor);
    context.setLineWidth(lineWidth);
    context.addPath(path);
    context.strokePath();
  };

  drawHalfCircle(centerX, centerY, startAngle, circleRadius, context, fillColor, direction = 1) {
    const halfCirclePath = new Path();
    const startX = centerX + circleRadius * Math.cos(startAngle);
    const startY = centerY + circleRadius * Math.sin(startAngle);
    halfCirclePath.move(new Point(startX, startY));

    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const angle = startAngle + direction * Math.PI * t;
        const x = centerX + circleRadius * Math.cos(angle);
        const y = centerY + circleRadius * Math.sin(angle);
        halfCirclePath.addLine(new Point(x, y));
    }

    context.setFillColor(fillColor);
    context.addPath(halfCirclePath);
    context.fillPath();
  };

  drawTickMarks(radius, color, startBgAngle, totalBgAngle, center, context) {
    const tickRadius = radius - 8;
    const tickLength = 4;

    const totalTicks = 20;
    for (let i = 0; i <= totalTicks; i++) {
      const t = i / totalTicks;
      const angle = startBgAngle + totalBgAngle * t;
      const x1 = center.x + tickRadius * Math.cos(angle);
      const y1 = center.y + tickRadius * Math.sin(angle);
      const x2 = center.x + (tickRadius - tickLength) * Math.cos(angle);
      const y2 = center.y + (tickRadius - tickLength) * Math.sin(angle);

      const tickPath = new Path();
      tickPath.move(new Point(x1, y1));
      tickPath.addLine(new Point(x2, y2));

      context.setStrokeColor(color);
      context.setLineWidth(1);
      context.addPath(tickPath);
      context.strokePath();
    }
  };

  progressBar() {
    const W = 200, H = this.barHeight , r = 6, h = 6;
    const drawing = this.makeCanvas(W, H);
    const progress = this.settings.stepMode === '月' ? this.currentMonthEle / this.wsgw.step_3 * W : parseFloat(this.stepEle) / this.wsgw.step_3 * W;
    const circle = progress - 2 * r;
    const fgColor = new Color(this.settings.barColor || '#0db38e', 1);
    const bgColor = new Color(this.settings.barColor || '#0db38e', 0.3);
    const pointerColor = new Color(this.settings.pointerColor || '#0db38e', 1);
    this.drawLine(drawing, r, H, r, 0, bgColor, 2);
    this.drawLine(drawing, W - r, H, W - r, 0, bgColor, 2);
    this.drawLine(drawing, this.wsgw.step_2 / this.wsgw.step_3 * W, H, this.wsgw.step_2 / this.wsgw.step_3 * W, 0, bgColor, 2);
    this.fillRect(drawing, 0, (H - h) / 2, W, h, h / 2, bgColor);
    this.fillRect(drawing, 0, (H - h) / 2, progress > W ? W : progress < r * 2 ? r * 2 : progress, h, h / 2, fgColor);
    this.fillRect(drawing, circle > W - r * 2 ? W - r * 2 : circle < 0 ? 0 : circle, H / 2 - r, r * 2, r * 2, r, pointerColor);
    return drawing.getImage();
  };
  
  wideProgressBar() {
    const width = 200;
    const height = 22;
    const progress = this.settings.stepMode === '月' ? this.currentMonthEle / this.wsgw.step_3 * width : parseFloat(this.stepEle) / this.wsgw.step_3 * width;
    const drawing = this.makeCanvas(width, height);
    this.drawLine(drawing, this.wsgw.step_2 / this.wsgw.step_3 * width, height, this.wsgw.step_2 / this.wsgw.step_3 * width, 0, new Color(this.smallStackColor, 0.3), 2);
    this.fillRect(drawing, 0, 0, width, height, 6, new Color(this.smallStackColor, 0.3));
    this.fillRect(drawing, 0, 0, progress > width? width : progress, height, 6, new Color(this.smallStackColor, 1));
    return drawing.getImage();
  };

  chartBar (opt, n) {
    let chartColor = new Color(this.settings.chartColor || '#0db38e', 1);
    const drawing = this.makeCanvas(n * 18 - 10, 50);
    let data = opt;
    if (data.length > n) {
      data = data.slice(data.length - n);
    }
    const max = Math.max(...data);
    const min = max / 2;
    if (data.length < n) {
      const gap = n - data.length;
      const newArr = [];
      for (let i = 0; i < gap; i++) {
        newArr.push(Math.floor(Math.random() * (max - min + 1)) + min);
      }
      data = [...data, ...newArr]
    };
    const deltaY = 50 / max;
    for (let i = 0; i < n; i++) {
      let	temp = data[i] * deltaY;
      if (i + 1  > opt.length) {
        chartColor = new Color(this.settings.chartColor || '#0db38e', 0.3);
      };
      this.fillRect(drawing, i * 18, 50 - temp, 8, temp, 4, chartColor)
    }
    return drawing.getImage();
  };

  gaugeChart() {
    const w = 150, h = 150;
    const drawing = this.makeCanvas(w, h);
    const center = new Point(w / 2, h / 2);
    const radius = w / 2 - 10;
    const circleRadius = 6;
    const startBgAngle = (11 * Math.PI) / 12;
    const endBgAngle = (25 * Math.PI) / 12;
    const totalBgAngle = endBgAngle - startBgAngle;
    const gapAngle = Math.PI / 15;
    const lineWidth = circleRadius * 2;
    
    const colors = [
    { base: new Color("#00CC99", 0.1), progress: new Color("#00CC99") },
    { base: new Color("#FFD700", 0.1), progress: new Color("#FFD700") },
    { base: new Color("#FF4500", 0.1), progress: new Color("#FF4500") },
    { base: new Color("#800020", 0.1), progress: new Color("#800020") }
    ];

    const segmentAngle = (totalBgAngle - 2 * gapAngle) / 3;
    
    const step = this.stepEleText();

    const level = step.level;
    let progress = parseFloat(step.progress.slice(0, -1)) / 100;
    progress = progress > 1 ? 1 : progress;
    
    for (let i = 0; i < 3; i++) {
      const segmentStartAngle = startBgAngle + i * (segmentAngle + gapAngle);
      const segmentEndAngle = segmentStartAngle + segmentAngle;

      this.drawArc(
        drawing,
        center,
        radius,
        segmentStartAngle,
        segmentEndAngle,
        100,
        colors[i].base,
        lineWidth
      );

      this.drawHalfCircle(
        center.x + radius * Math.cos(segmentStartAngle),
        center.y + radius * Math.sin(segmentStartAngle),
        segmentStartAngle,
        circleRadius,
        drawing,
        colors[i].base,
        -1
      );
      this.drawHalfCircle(
        center.x + radius * Math.cos(segmentEndAngle),
        center.y + radius * Math.sin(segmentEndAngle),
        segmentEndAngle,
        circleRadius,
        drawing,
        colors[i].base,
        1
      );

      if (level > i) {
        const stepColors = this.gradientColor([`#${colors[i].progress.hex}`, `#${colors[i+1].progress.hex}`], 51);
        const isCurrentLevel = level === i + 1;
        const progressEndAngle = isCurrentLevel
          ? segmentStartAngle + progress * segmentAngle
          : segmentEndAngle;
        const p = isCurrentLevel ? progress * 50 : 50; // 插值因子
        this.lastColor = this.gradientColor([`#${colors[level - 1].progress.hex}`, `#${colors[level].progress.hex}`], 51)[Math.round(p)];

        for (let j = 0; j <= p; j++) {
          const t = j / p;
          const angle = segmentStartAngle + t * (progressEndAngle - segmentStartAngle);
          const x = center.x + radius * Math.cos(angle);
          const y = center.y + radius * Math.sin(angle);

          const circleRect = new Rect(
            x - circleRadius,
            y - circleRadius,
            circleRadius * 2,
            circleRadius * 2
          );
          drawing.setFillColor(new Color(stepColors[j]));
          drawing.fillEllipse(circleRect);
        }
      }
    }

    return drawing.getImage();
  }
  // ######################################
  // ######################################
  formatDate() {
    let theDate = Date.now();
    let dF = new DateFormatter();
    dF.dateFormat = 'yyyy-MM-dd HH:mm:ss';
    theDate = new Date(theDate);
    return dF.string(theDate);
  };

  getTime = () => {
    const dateTime = this.update;
    const parts = dateTime.split(' ');
    const datePart = parts[0].split('-');
    const timePart = parts[1].split(':');
    return `${datePart[1]}-${datePart[2]} ${timePart[0]}:${timePart[1]}`;
  };
  // 获取缩放比例
  getWidgetScaleFactor() {
    const referenceScreenSize = { width: 430, height: 932, widgetSize: 170 };
    const screenData = [
      { width: 440, height: 956, widgetSize: 170 }, // 16 Pro Max
      { width: 430, height: 932, widgetSize: 170 }, // 16 Plus, 15 Plus, 15 Pro Max, 14 Pro Max
      { width: 428, height: 926, widgetSize: 170 }, // 14 Plus, 13 Pro Max, 12 Pro Max
      { width: 414, height: 896, widgetSize: 169 }, // 11 Pro Max, XS Max, 11, XR
      { width: 402, height: 874, widgetSize: 162 }, // 16 Pro
      { width: 414, height: 736, widgetSize: 159 }, // Home button Plus phones
      { width: 393, height: 852, widgetSize: 158 }, // 16, 15, 15 Pro, 14 Pro
      { width: 390, height: 844, widgetSize: 158 }, // 14, 13, 13 Pro, 12, 12 Pro
      { width: 375, height: 812, widgetSize: 155 }, // 13 mini, 12 mini / 11 Pro, XS, X
      { width: 375, height: 667, widgetSize: 148 }, // SE3, SE2, Home button Plus in Display Zoom mode
      { width: 360, height: 780, widgetSize: 155 }, // 11 and XR in Display Zoom mode
      { width: 320, height: 568, widgetSize: 141 } // SE1
    ];

    const deviceScreenWidth = Device.screenSize().width;
    const deviceScreenHeight = Device.screenSize().height;

    const matchingScreen = screenData.find(screen => 
      (screen.width === deviceScreenWidth && screen.height === deviceScreenHeight) ||
      (screen.width === deviceScreenHeight && screen.height === deviceScreenWidth)
    );

    if (!matchingScreen) {
      return 1;
    };

    const scaleFactor = (matchingScreen.widgetSize - 30 ) / (referenceScreenSize.widgetSize - 30);

    return Math.floor(scaleFactor * 100) / 100;
  };

  gradientColor(colors, step) {
    var startRGB = this.colorToRgb(colors[0]),
    startR = startRGB[0],
    startG = startRGB[1],
    startB = startRGB[2];

    var endRGB = this.colorToRgb(colors[1]),
    endR = endRGB[0],
    endG = endRGB[1],
    endB = endRGB[2];

    var sR = (endR - startR) / step,
    sG = (endG - startG) / step,
    sB = (endB - startB) / step;

    var colorArr = [];
    for (var i = 0;i < step; i++) {
     var hex = this.colorToHex('rgb(' + parseInt((sR * i + startR)) + ',' + parseInt((sG * i + startG)) + ',' + parseInt((sB * i + startB)) + ')');
     colorArr.push(hex);
    }
    return colorArr;
  }

  colorToRgb(sColor) {
    var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    var sColor = sColor.toLowerCase();
    if (sColor && reg.test(sColor)) {
      if (sColor.length === 4) {
        var sColorNew = "#";
        for (var i = 1; i < 4; i += 1) {
          sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
        }
        sColor = sColorNew;
      }
      var sColorChange = [];
      for (var i = 1; i < 7; i += 2) {
        sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
      }
      return sColorChange;
    } else {
      return sColor;
    }
  };

  colorToHex(rgb) {
    var _this = rgb;
    var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    if (/^(rgb|RGB)/.test(_this)) {
      var aColor = _this.replace(/(?:\(|\)|rgb|RGB)*/g,"").split(",");
      var strHex = "#";
      for (var i = 0; i < aColor.length; i++) {
        var hex = Number(aColor[i]).toString(16);
        hex = hex.length < 2 ? 0 + '' + hex : hex;
        if (hex === "0") {
          hex += hex;
        }
        strHex += hex;
      }
      if (strHex.length !== 7) {
        strHex = _this;
      }
      return strHex;
    } else if (reg.test(_this)) {
      var aNum = _this.replace(/#/,"").split("");
      if (aNum.length === 6) {
        return _this;
      } else if (aNum.length === 3) {
        var numHex = "#";
        for (var i = 0; i < aNum.length; i+=1) {
          numHex += (aNum[i] + aNum[i]);
        }
        return numHex;
      }
    } else {
      return _this;
    }
  }

  createCenteredText(stack, content, unit, fontIndex, fontSize, color, opacity = 1, icon) {
    const systemFonts = [
      // 0, Default
      Font.systemFont(fontSize),
      // 1, Light
      Font.lightSystemFont(fontSize),
      // 2, Medium
      Font.mediumSystemFont(fontSize),
      // 3, Bold
      Font.boldSystemFont(fontSize),
      // 4, Medium Rounded
      Font.mediumRoundedSystemFont(fontSize),
      // 5, Semibold Rounded
      Font.semiboldRoundedSystemFont(fontSize),
      // 6, Bold Rounded
      Font.boldRoundedSystemFont(fontSize)
    ];
    const rowStack = stack.addStack();
    rowStack.centerAlignContent();
    rowStack.addSpacer();

    if(icon) {
      const sfs = SFSymbol.named(icon);
      const sfsImg = rowStack.addImage(sfs.image);
      sfsImg.tintColor = color;
      sfsImg.imageSize = new Size(15 * this.SCALE, 15 * this.SCALE);
      rowStack.addSpacer(3);
    }

    let textElement = rowStack.addText(content);
    textElement.font = systemFonts[fontIndex] || Font.systemFont(fontSize);
    textElement.textColor = color;
    textElement.textOpacity = opacity;
    this.addChineseUnit(rowStack, unit, color, 13 * this.SCALE);
    rowStack.addSpacer();
    return rowStack;
  };

  createCenteredStack(stack, text, bgColor) {
    const outStack = stack.addStack();
    outStack.addSpacer();
    const innerStack = outStack.addStack();
    innerStack.setPadding(1, 1, 1, 1);
    innerStack.backgroundColor = bgColor;
    innerStack.cornerRadius = 3;
    const textElement = innerStack.addText(text);
    textElement.textColor = Color.white();
    textElement.font = Font.mediumSystemFont(10 * this.SCALE);
    outStack.addSpacer();
    return outStack;
  };
  // ######################################
  // ######################################
  httpRequest = async(dataName, url, json = true, options, key, method = 'GET', retryCount = 2) => {
    let cacheKey = key;
    let localCache = this.loadStringCache(cacheKey);
    const lastCacheTime = this.getCacheModificationDate(cacheKey);
    const timeInterval = lastCacheTime > 0 ? Math.floor((this.getCurrentTimeStamp() - lastCacheTime) / 60) : 999999;
    
    if (lastCacheTime > 0 && localCache) {
      console.log(`${dataName}：读取缓存 ${timeInterval} 分钟前，刷新间隔 ${this.wsgw.interval} 分钟`);
    } else {
      console.log(`${dataName}：本地无缓存，准备在线获取最新数据...`);
    }

    // 如果缓存有效，直接返回缓存
    if (timeInterval < this.wsgw.interval && localCache != null && localCache.length > 0) {
      return json ? JSON.parse(localCache) : localCache;
    }

    // 尝试在线请求（带重试）
    let data = null;
    let lastError = null;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        let req = new Request(url);
        req.method = method;
        
        Object.keys(options).forEach((key) => {
          req[key] = options[key];
        });
        
        data = await (json ? req.loadJSON() : req.loadString());
        
        // 验证数据有效性
        if (json && (!data || typeof data !== 'object')) {
          throw new Error('返回数据格式无效');
        }
        
        // 保存缓存
        this.saveStringCache(cacheKey, json ? JSON.stringify(data) : data);
        console.log(`${dataName}：在线请求成功`);
        return data;
        
      } catch (e) {
        lastError = e;
        if (attempt < retryCount) {
          console.log(`${dataName}：请求失败，重试中...`);
        }
      }
    }

    // 所有重试失败，尝试使用缓存
    localCache = this.loadStringCache(cacheKey);
    if (localCache != null && localCache.length > 0) {
      console.log(`${dataName}：请求失败，使用缓存`);
      try {
        return json ? JSON.parse(localCache) : localCache;
      } catch (e) {
        console.error(`${dataName}：缓存解析失败`);
      }
    }

    // 没有可用数据
    console.error(`${dataName}：加载失败 (${lastError?.message || '网络错误'})`);
    throw new Error(`无法获取${dataName}`);
  };

  loadStringCache(cacheKey) {
    const cacheFile = this.fm.joinPath(this.cachePath, cacheKey);
    const fileExists = this.fm.fileExists(cacheFile);
    let cacheString = '';
    if (fileExists) {
      cacheString = this.fm.readString(cacheFile);
    }
    return cacheString;
  };

  saveStringCache(cacheKey, content) {
    if (!this.fm.fileExists(this.cachePath)) {
      this.fm.createDirectory(this.cachePath, true);
    };
    const cacheFile = this.fm.joinPath(this.cachePath, cacheKey);
    this.fm.writeString(cacheFile, content);
  };

  getCacheModificationDate(cacheKey) {
    const cacheFile = this.fm.joinPath(this.cachePath, cacheKey);
    const fileExists = this.fm.fileExists(cacheFile);
    if (fileExists) {
      return this.fm.modificationDate(cacheFile).getTime() / 1000;
    } else {
      return 0;
    }
  };

  getCurrentTimeStamp() {
    return new Date().getTime() / 1000;
  };

  getImageByUrl = async(url, cacheKey) => {
    const cacheImg = this.loadImgCache(cacheKey);
    if (cacheImg != undefined && cacheImg != null) {
      // 使用缓存图片（不输出日志）
      return this.loadImgCache(cacheKey);
    }

    try {
      console.log(`在线请求：${cacheKey}`);
      const req = new Request(url);
      const imgData = await req.load();
      const img = Image.fromData(imgData);
      this.saveImgCache(cacheKey, img);
      return img;
    } catch (e) {
      console.error(`图片加载失败：${e}`);
      let cacheImg = this.loadImgCache(cacheKey);
      if (cacheImg != undefined) {
        // 使用缓存图片（不输出日志）
        return cacheImg;
      }
      console.log(`使用预设图片`);
      let ctx = new DrawContext();
      ctx.size = new Size(80, 80);
      ctx.setFillColor(Color.darkGray());
      ctx.fillRect(new Rect(0, 0, 80, 80));
      return await ctx.getImage();
    }
  };

  loadImgCache(cacheKey) {
    const cacheFile = this.fm.joinPath(this.cachePath, cacheKey);
    const fileExists = this.fm.fileExists(cacheFile);
    let img = undefined;
    if (fileExists) {
      if (this.settings.useICloud ==='true') this.fm.downloadFileFromiCloud(this.cachePath);
      img = Image.fromFile(cacheFile);
    }
    return img;
  };

  saveImgCache(cacheKey, img) {
    if (!this.fm.fileExists(this.cachePath)) {
      this.fm.createDirectory(this.cachePath, true);
    };
    const cacheFile = this.fm.joinPath(this.cachePath, cacheKey);
    this.fm.writeImage(cacheFile, img);
  };

  async checkAndUpdateScript() {
    const downloadUrl = "https://raw.githubusercontent.com/githubdulong/Script/master/Scriptable/SGCC.js";
    const scriptName = Script.name() + '.js';

    try {
      const req = new Request(downloadUrl);
      const newScriptContent = await req.loadString();

      if (!newScriptContent || !newScriptContent.includes('Widget')) {
        throw new Error('获取到的脚本内容异常，请检查网络或更新链接');
      }

      // 精准匹配组件版本号（优先匹配类属性 version = 'x.x.x'）
      const versionMatch = newScriptContent.match(/version\s*=\s*['"]([0-9.]+)['"]/) || newScriptContent.match(/\*\s*version:\s*([0-9.]+)/);
      const remoteVersion = versionMatch ? versionMatch[1] : '';

      // 严格对比版本号 (语义化版本比对)
      const isNewerVersion = (v1, v2) => {
        if (!v1) return false;
        const p1 = v1.split('.').map(Number);
        const p2 = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
          const num1 = p1[i] || 0;
          const num2 = p2[i] || 0;
          if (num1 > num2) return true;
          if (num1 < num2) return false;
        }
        return false;
      };

      if (isNewerVersion(remoteVersion, this.version)) {
        const alert = new Alert();
        alert.title = "检测到新版本";
        alert.message = `发现新版本：v${remoteVersion}（当前版本：v${this.version}），是否立即更新？`;
        alert.addAction("立即更新");
        alert.addCancelAction("取消");

        const response = await alert.presentAlert();
        if (response === 0) {
          const fm = FileManager[
            module.filename.includes('Documents/iCloud~') ? 'iCloud' : 'local'
          ]();
          const scriptPath = fm.documentsDirectory() + `/${scriptName}`;
          fm.writeString(scriptPath, newScriptContent);

          const successAlert = new Alert();
          successAlert.title = "更新成功";
          successAlert.message = `脚本已更新至 v${remoteVersion}，请重新打开运行！`;
          successAlert.addAction("确定");
          await successAlert.present();
          this.reopenScript();
        }
      } else {
        const noUpdateAlert = new Alert();
        noUpdateAlert.title = "无需更新";
        noUpdateAlert.message = `当前已是最新版本 (v${this.version})。`;
        noUpdateAlert.addAction("确定");
        await noUpdateAlert.present();
      }
    } catch (e) {
      const errAlert = new Alert();
      errAlert.title = "更新检查失败";
      errAlert.message = e.message || String(e);
      errAlert.addAction("确定");
      await errAlert.present();
    }
  }
  // ######################################
  // ######################################
  getBimonthlyStepEle() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const data = this.monthElePq

    // 工具函数：根据年份和月份生成标签
    function getLabel(year, month) {
      return `${year}${month.toString().padStart(2, '0')}`;
    }

    // 工具函数：查找数据
    function findData(label) {
      return data.find(item => item.label === label);
    }

    // 定义 stepEle 的初始值
    let stepEle = 0;

    if (currentMonth % 2 === 1) { // 奇数月
      // 获取上个月的标签
      let previousYear = currentYear;
      let previousMonth = currentMonth - 1;

      if (previousMonth === 0) { // 处理跨年
        previousYear -= 1;
        previousMonth = 12;
      }

      const previousLabel = getLabel(previousYear, previousMonth);
      const previousData = findData(previousLabel);

      if (previousData) {
        // 如果上个月的数据存在，返回 currentMonthEle
        stepEle = Number(this.currentMonthEle);
      } else {
        // 如果上个月的数据不存在，检查上上个月的数据
        let twoMonthsAgoYear = previousYear;
        let twoMonthsAgoMonth = previousMonth - 1;

        if (twoMonthsAgoMonth === 0) { // 处理跨年
          twoMonthsAgoYear -= 1;
          twoMonthsAgoMonth = 12;
        }

        const twoMonthsAgoLabel = getLabel(twoMonthsAgoYear, twoMonthsAgoMonth);
        const twoMonthsAgoData = findData(twoMonthsAgoLabel);

        if (twoMonthsAgoData) {
          // 如果上上个月的数据存在，返回上上个月的 elePq + currentMonthEle
          stepEle = twoMonthsAgoData.elePq + Number(this.currentMonthEle);
        } else {
          console.log("未找到足够的数据！");
        }
      }
    } else { // 偶数月
      // 获取上个月的标签
      const previousYear = currentYear;
      const previousMonth = currentMonth - 1;

      const previousLabel = getLabel(previousYear, previousMonth);
      const previousData = findData(previousLabel);

      if (previousData) {
        // 如果上个月的数据存在，返回上个月 elePq + currentMonthEle
        stepEle = previousData.elePq + Number(this.currentMonthEle);
      } else {
        // 如果上个月的数据不存在，返回 currentMonthEle
        stepEle = Number(this.currentMonthEle);
      }
    }

    return stepEle
  }
  // 获取当月电量
  getSumForCurrentMonth(data) {
    function sumValuesForMonth(data, year, month) {
      return data
        .filter(item => item.label.startsWith(`${year}${month.toString().padStart(2, '0')}`))
        .reduce((sum, item) => sum + item.elePq, 0);
    }

    // 获取当前年月
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; 

    // 计算当月电费总和
    let sum = sumValuesForMonth(data, currentYear, currentMonth);
    
    if (sum === 0) {
      // 如果本月没有数据，计算上月的数据
      const previousYear = currentMonth === 1? currentYear - 1 : currentYear;
      const previousMonth = currentMonth === 1? 12 : currentMonth - 1;
      // 检查 data 中是否有上个月的数据
      const hasPreviousMonthData = this.monthElePq.some(item => item.label === `${previousYear}${previousMonth.toString().padStart(2, '0')}`);
      if (hasPreviousMonthData) {
        sum = 0;
      } else {
        sum = sumValuesForMonth(data, previousYear, previousMonth);
      }
    }

    return sum.toFixed(2);
  };

  fetchSgccData = async () => {
    let phone = (this.settings.phone || '').trim();
    // 自动清洗手机号，剔除 +86、空格、短横线
    phone = phone.replace(/^(\+?86)?\s*/, '').replace(/\D/g, '');
    const password = (this.settings.password || '').trim();
    if (!phone || !password) {
      throw new Error('未配置账号：请点击小组件进入「账号配置」填写国网手机号和密码');
    }

    const self = this;
    const ctx = {
      env: {
        SGCC_SMS: secretGet('inputSMS.' + md5hex(phone), '') || (this.settings.smsCode || '').trim(),
      },
      storage: {
        getJSON: (k) => {
          if (sensitiveKey(k)) return secretGet('state.' + k);
          try {
            const s = self.loadStringCache(`sgcc_${k}.json`);
            return s ? JSON.parse(s) : null;
          } catch (_) { return null; }
        },
        setJSON: (k, v) => {
          if (sensitiveKey(k)) {
            secretSet('state.' + k, v);
            return;
          }
          try {
            self.saveStringCache(`sgcc_${k}.json`, JSON.stringify(v));
          } catch (_) {}
        }
      },
      http: {
        post: async (url, req) => {
          const r = new Request(url);
          r.method = 'POST';
          // Scriptable Request.headers 要求所有 value 必须是 string，null/undefined 会抛异常
          const safeHeaders = {};
          const rawH = req.headers || {};
          for (const [hk, hv] of Object.entries(rawH)) {
            safeHeaders[hk] = hv == null ? '' : String(hv);
          }
          r.headers = safeHeaders;
          // Scriptable Request.body 需要 string 类型
          const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || '');
          r.body = bodyStr;
          r.timeoutInterval = (req.timeout || 20000) / 1000;
          try {
            const text = await r.loadString();
            const status = r.response ? r.response.statusCode : 200;
            return {
              status,
              text: async () => text
            };
          } catch (netErr) {
            console.error('网络请求异常: ' + url + ' -> ' + (netErr.message || netErr));
            throw netErr;
          }
        }
      }
    };

    let app, s;
    try {
      app = new SgccProtocol.SgApp(ctx, phone, password);
    } catch (e) {
      throw new Error('SgApp初始化失败: ' + (e.message || e));
    }
    try {
      s = await app.ensure();
    } catch (e) {
      if (e && e.code === '4006') throw e;
      throw new Error('登录失败: ' + (e.message || e));
    }
    const accts = s.accounts || [];
    if (!accts.length) throw new Error('国网账号未绑定任何户号');

    const out = [];
    for (const a of accts.slice(0, 6)) {
      try {
        out.push(await SgccProtocol.queryAccount(app, a));
      } catch (e) {
        if (!out.length && a === accts[accts.length - 1]) throw e;
      }
    }
    if (!out.length) throw new Error('国网户号数据查询失败');
    return out;
  };

  getBillData = async () => {
    const dataName = '国网数据';
    const cacheKey = 'BillData.json';
    let localCache = this.loadStringCache(cacheKey);
    const lastCacheTime = this.getCacheModificationDate(cacheKey);
    const timeInterval = lastCacheTime > 0 ? Math.floor((this.getCurrentTimeStamp() - lastCacheTime) / 60) : 999999;

    if (lastCacheTime > 0 && localCache) {
      console.log(`${dataName}：读取缓存 ${timeInterval} 分钟前，刷新间隔 ${this.wsgw.interval} 分钟`);
    } else {
      console.log(`${dataName}：本地无缓存，准备在线获取最新数据...`);
    }

    // 缓存有效时优先使用缓存
    if (timeInterval < this.wsgw.interval && localCache != null && localCache.length > 0) {
      try {
        this.data = JSON.parse(localCache);
      } catch (_) {
        this.data = null;
      }
    }

    // 缓存无效或为空时，在线请求国网 App 官方直连接口
    if (!this.data || !Array.isArray(this.data) || this.data.length === 0) {
      try {
        console.log(`${dataName}：开始在线请求国网 App 接口...`);
        try {
          this.data = await this.fetchSgccData();
        } catch (sgErr) {
          // 输出完整错误栈以便调试
          console.error(`[SGCC-DEBUG] fetchSgccData 异常: ${sgErr.message || sgErr}`);
          if (sgErr.stack) console.error(`[SGCC-DEBUG] Stack: ${sgErr.stack}`);
          throw sgErr;
        }
        this.saveStringCache(cacheKey, JSON.stringify(this.data));
        console.log(`${dataName}：在线请求成功并已写入缓存`);
      } catch (e) {
        console.error(`${dataName}：请求失败：${e.message || e}`);
        if (localCache != null && localCache.length > 0) {
          try {
            this.data = JSON.parse(localCache);
            console.log(`${dataName}：在线请求失败，回退使用上一次缓存`);
          } catch (_) {}
        }
        if (!this.data) {
          throw e;
        }
      }
    }

    try {
      // 验证数据结构完整性
      if (!this.data || !Array.isArray(this.data) || this.data.length === 0) {
        throw new Error("数据为空");
      }
      
      this.getUserInfo();
      const billData = await this.getData();
      
      if (!billData) {
        throw new Error("账户不存在");
      }
      
      // 安全获取日用电数据
      if (billData.dayElecQuantity31?.sevenEleList) {
        this.dayElePq = billData.dayElecQuantity31.sevenEleList
          .filter((item) => item.dayElePq !== '-')
          .map((item) => ({
            label: item.day,
            elePq: parseFloat(item.dayElePq) || 0,
          }));
      } else {
        this.dayElePq = [];
      }
      
      // 安全获取月用电数据
      if (billData.monthElecQuantity?.mothEleList) {
        this.monthElePq = billData.monthElecQuantity.mothEleList.map((item) => ({
          label: item.month,
          elePq: parseFloat(item.monthEleNum) || 0,
          cost: parseFloat(item.monthEleCost) || 0,
        }));
      } else {
        this.monthElePq = [];
      }
      
      // 安全获取账单信息
      if (billData.eleBill) {
        this.isOverdue = billData.arrearsOfFees || false;
        this.isPostPaid = billData.eleBill.hasOwnProperty('accountBalance');
        this.update = billData.eleBill.date || this.formatDate();
        
        const sumMoney = Number(billData.eleBill.sumMoney || 0).toFixed(2);
        const accountBalance = Number(billData.eleBill.accountBalance || 0).toFixed(2);
        
        this.balance = this.isOverdue ? '-' + Math.abs(sumMoney) : sumMoney;
        this.remainFee = this.isPostPaid ? accountBalance : sumMoney;
      } else {
        this.balance = "N/A";
        this.remainFee = "N/A";
      }
      
      // 计算统计数据
      this.currentMonthEle = this.getSumForCurrentMonth(this.dayElePq);
      
      // 寻找最近一个已结算月份的数据作为"上期"
      const mList = (billData.monthElecQuantity?.mothEleList || []).slice().sort((a, b) => (String(a.month) < String(b.month) ? -1 : 1));
      const nowYm = this.formatDate(new Date(), 'yyyyMM');
      // 优先取小于当前月的最新一个月，或者列表中最后一个有效数据
      const validPastMonths = mList.filter(item => String(item.month) < nowYm && (parseFloat(item.monthEleCost) > 0 || parseFloat(item.monthEleNum) > 0));
      const lastMonthData = validPastMonths.length ? validPastMonths[validPastMonths.length - 1] : (mList[mList.length - 1] || {});
      
      this.monthUsage = parseFloat(lastMonthData?.monthEleNum || 0);
      this.monthFee = parseFloat(lastMonthData?.monthEleCost || 0).toFixed(2);
      
      const totalEleNum = parseFloat(billData.monthElecQuantity?.dataInfo?.totalEleNum || 0);
      const totalEleCost = parseFloat(billData.monthElecQuantity?.dataInfo?.totalEleCost || 0);
      
      this.yearUsage = totalEleNum + Math.round(this.currentMonthEle);
      this.yearFee = totalEleCost.toFixed(2);
      
      // 计算阶梯电量
      const stepBase = parseFloat(
        billData.stepElecQuantity?.[0]?.electricParticulars?.totalYearPq ||
        totalEleNum ||
        0
      );
      this.stepEle = stepBase + Math.round(this.currentMonthEle);
      
      if (this.settings.stepMode === '双月') {
        this.stepEle = this.getBimonthlyStepEle();
      }
      
    } catch (e) {
      console.error(`${dataName}加载失败: ${e.message || e}`);
      
      // 降级处理
      this.balance = "ERROR";
      this.remainFee = "ERROR";
      this.monthUsage = 0;
      this.monthFee = 0;
      this.yearUsage = 0;
      this.yearFee = 0;
      this.currentMonthEle = 0;
      this.stepEle = 0;
      this.dayElePq = [];
      this.monthElePq = [];
      this.update = this.formatDate();
    }
  };

  async getData() {
    this.updateIndex();
    return this.data?.[this.index];
  };
  
  getUserInfo() {
    const customNames = [
      this.settings.name,
      this.settings.name_1,
      this.settings.name_2,
      this.settings.name_3,
      this.settings.name_4,
    ];

    const userArray = this.data.map((item, index) => {
      const conNo_dst = item.userInfo.consNo_dst || item.userInfo.consNo || '未知户号';
      const rawName = item.userInfo.consName_dst || item.userInfo.consName || '';
      // 过滤国网加密的内部凭据 ID (如 99:hash:... 或超长字符)
      let displayName = customNames[index] || '';
      if (!displayName) {
        if (rawName && !/[:：]/.test(rawName) && rawName.length <= 12) {
          displayName = rawName;
        } else {
          displayName = `用电户 ${index + 1}`;
        }
      }
      console.log(`用户${index + 1}下标: ${index}, 户名: ${displayName}, 户号: ${conNo_dst}`);
      return {
        conNo_dst,
        consName_dst: displayName
      };
    });
    console.log(`多户显示：桌面小组件长按 --> 编辑小组件 --> Parameter 输入对应户号的下标数字`);
  };
  
  getEleLevel() {
    let dayElePq = [];
    if (this.settings.stepMode === '月') {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      dayElePq = this.dayElePq.filter(item => item.label.startsWith(currentMonth));
    };
    
    let bimonthElePq = [];
    if (this.settings.stepMode === '双月') {
      const data = this.monthElePq;
      if (data.length % 2 !== 0) {
        data.pop();
      }
      
      for (let i = 0; i < data.length; i += 2) {
        const mergedItem = {
          label: `${data[i].label}-${data[i+1].label}`,
          elePq: data[i].elePq + data[i+1].elePq,
          cost: data[i].cost + data[i+1].cost
        };
        bimonthElePq.push(mergedItem);
      }
    }

    let eleList = [];
    let total = 0;
    for (const { elePq } of this.settings.stepMode === '月' ? dayElePq : this.settings.stepMode === '双月' ? bimonthElePq : this.monthElePq) {
      const n = Number(elePq);
      total += n;
      if (this.settings.stepMode === '双月') total = n;
      const level = total > Number(this.wsgw.step_3) ? 3 : total > Number(this.wsgw.step_2) ? 2 : 1;
      eleList.push({ value: n, level });
    }

    return eleList
  };

  updateIndex() {
    const i = args.widgetParameter;
    if (i == 0 || !i || i == null) {
        this.name = this.settings.name;
        this.smallStackColor = this.settings.smallStackColor || this.smallStackColor;
        this.widgetStyle = this.settings.widgetStyle || this.widgetStyle;
        this.endColor = this.settings.endColor || this.endColor;
        return;
    }

    if (!this.data[i]) throw new Error("户号不存在");

    if (i == 1) {
        this.name = this.settings.name_1;
        this.smallStackColor = this.settings.smallStackColor_1 || this.smallStackColor;
        this.widgetStyle = this.settings.widgetStyle_1 || this.widgetStyle;
        this.endColor = this.settings.endColor_1 || this.endColor;
    } else if (i == 2) {
        this.name = this.settings.name_2;
        this.smallStackColor = this.settings.smallStackColor_2 || this.smallStackColor;
        this.widgetStyle = this.settings.widgetStyle_2 || this.widgetStyle;
        this.endColor = this.settings.endColor_2 || this.endColor;
    } 
    this.index = i;
  };

  last = (data = [], index = 1) => {
    return data[data.length - index];
  };
  // ######################################
  // ######################################
  async setWidgetStyle_1 (stack) {
    //  余额
    const headerStack = stack.addStack();
    const hlStack = headerStack.addStack();
    hlStack.layoutVertically();
    let balance = this.balance;
    let balanceTitle = this.isOverdue ? '电费欠费' : '电费余额';
    if (!this.isOverdue && this.isPostPaid) {
      balance = this.settings.showBalance === 'true' ? this.remainFee : this.monthFee;
      balanceTitle = this.settings.showBalance === 'true' ? '电费余额' : '上期电费';
    };
    const titleStack = hlStack.addStack();
    titleStack.layoutVertically();
    const title = titleStack.addText(balanceTitle);
    const balanceStack = hlStack.addStack();
    const balanceText = balanceStack.addText(`${balance}`);
    this.unit(balanceStack, '元', 11.5 * this.SCALE, this.widgetColor);
    title.font = Font.systemFont(12 * this.SCALE);
    title.textOpacity = 0.7;
    balanceText.font = Font.boldRoundedSystemFont(23 * this.SCALE);
    balanceText.minimumScaleFactor = 0.5;
    [title, balanceText].map(t => {
      t.textColor = this.widgetColor;
    });
    headerStack.addSpacer();
    let wsgw = headerStack.addImage(await this.getLogo());
    wsgw.imageSize = new Size(26 * this.SCALE, 26 * this.SCALE);
    if (this.smallStackColor !== '#3A9690') wsgw.tintColor = new Color(this.smallStackColor);
    stack.addSpacer();
    //  进度条
    const stepByMonth = this.settings.stepMode === '月';
    const stepByBimonth = this.settings.stepMode === '双月';
    const circlesPerRow = stepByMonth ? 10 : stepByBimonth ? 3 : 4; // 每排的圆圈数量
    const totalCircles = stepByMonth ? 30 : stepByBimonth ? 6 : 12; // 总圆圈数量
    const circleWidth = stepByMonth ? 10 * this.SCALE : stepByBimonth ? 44.07 * this.SCALE : 31.9 * this.SCALE;; // 每个圆圈的宽度
    const circleHeight = stepByMonth ? 10 * this.SCALE : 8 * this.SCALE; // 每个圆圈的高度
    const circleCornerRadius = stepByMonth ? 5 * this.SCALE : 4 * this.SCALE; // 圆角半径
    const circleGap = 4.6 * this.SCALE; // 圆圈之间的间距

    const eleList = this.getEleLevel();

    const levelGradients = [
      [new Color("#D6F2E1"), new Color("#98D2BC")], 
      [new Color("#FFC777"), new Color("#FFB043")], 
      [new Color("#F1939C"), new Color("#F07C82")], 
    ];
    const defaultColor = new Color("#81CDC7", 0.2);

    function gradientColors(startColor, endColor, steps) {
      const colors = [];
      if (steps === 1) {
        colors.push(startColor);
        return colors;
      }
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1); // 计算插值比例
        const r = Math.round(startColor.red * 255 + t * (endColor.red * 255 - startColor.red * 255));
        const g = Math.round(startColor.green * 255 + t * (endColor.green * 255 - startColor.green * 255));
        const b = Math.round(startColor.blue * 255 + t * (endColor.blue * 255 - startColor.blue * 255));
        const a = startColor.alpha + t * (endColor.alpha - startColor.alpha);

        const hexColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        colors.push(new Color(hexColor, a));
      }
      return colors;
    }

    const levelGradientColors = levelGradients.map(([start, end], i) => {
      const levelCount = eleList.filter(item => item.level === i + 1).length;
      return gradientColors(start, end, levelCount);
    });

    let levelIndex = { 1: 0, 2: 0, 3: 0 };

    for (let row = 0; row < Math.ceil(totalCircles / circlesPerRow); row++) {
      const rowStack = stack.addStack();
      rowStack.layoutHorizontally();
      rowStack.centerAlignContent();

      for (let col = 0; col < circlesPerRow; col++) {
        const index = row * circlesPerRow + col;
        if (index >= totalCircles) break;

        const circle = rowStack.addStack();
        circle.size = new Size(circleWidth, circleHeight);
        circle.cornerRadius = circleCornerRadius;

        const data = eleList[index]; 
        let fillColor = defaultColor;
        if (data && data.level >= 1 && data.level <= 3) {
          fillColor = levelGradientColors[data.level - 1][levelIndex[data.level]];
          levelIndex[data.level]++;
        }

        circle.backgroundColor = fillColor;

        if (col < circlesPerRow - 1) rowStack.addSpacer(circleGap);
      }

      if (row < Math.ceil(totalCircles / circlesPerRow) - 1) stack.addSpacer(circleGap);
    }
    // 底部数据
    const extraData = this.getWidgetData(this.settings.smallStyle_1 || '本月电量');
    stack.addSpacer();
    
    this.setList(stack, extraData, this.smallStackColor)
  };
  
  async setWidgetStyle_2 (stack) {
    const bodyStack = stack.addStack();
    //bodyStack.backgroundColor = Color.dynamic(new Color("#E2E2E7", 0), new Color("#2C2C2F"));
    bodyStack.cornerRadius = 14 * this.SCALE;
    bodyStack.layoutVertically();
    const headerStack = bodyStack.addStack();
    headerStack.setPadding(8 * this.SCALE, 12 * this.SCALE, 0, 12 * this.SCALE);
    headerStack.layoutVertically();

    let balance = this.balance;
    let balanceTitle = this.isOverdue ? '电费欠费' : '电费余额';
    if (!this.isOverdue && this.isPostPaid) {
      balance = this.settings.showBalance === 'true' ? this.remainFee : this.monthFee;
      balanceTitle = this.settings.showBalance === 'true' ? '电费余额' : '上期电费';
    };

    const title = headerStack.addText(balanceTitle);
    title.font = Font.systemFont(12 * this.SCALE);
    title.textColor = this.widgetColor;
    title.textOpacity = 0.7;
    const balanceStack = headerStack.addStack();
    const balanceText = balanceStack.addText(balance);
    balanceText.minimumScaleFactor = 0.5;
    balanceText.font = Font.boldRoundedSystemFont(22 * this.SCALE);
    balanceText.minimumScaleFactor = 0.5;
    const color = this.widgetColor;
    balanceText.textColor = color;
    this.unit(balanceStack, '元', 6 * this.SCALE, color);
    balanceStack.addSpacer();
    balanceStack.centerAlignContent();

    const logoImage = balanceStack.addImage(await this.getLogo());
    logoImage.imageSize = new Size(24 * this.SCALE, 24 * this.SCALE);

    bodyStack.addSpacer();
    const mainStack = bodyStack.addStack();
    mainStack.setPadding(8 * this.SCALE, 12 * this.SCALE, 8 * this.SCALE, 12 * this.SCALE);
    mainStack.cornerRadius = 14 * this.SCALE;
    mainStack.backgroundColor = Color.dynamic(new Color("#E2E2E7", 0.3), new Color("#2C2C2F", 1));
    mainStack.layoutVertically();

    this.setList(
      mainStack,
      this.getWidgetData(this.settings.smallStyle_2_up || '本月电量'),
      this.smallStackColor
    );

    mainStack.addSpacer();

    this.setList(
      mainStack,
      this.getWidgetData(this.settings.smallStyle_2_down || '近日用电'),
      this.endColor
    );
  };
  
  async setWidgetStyle_3 (stack, color) {
    //  标题
    this.setTitle(stack, new Color(color), new Color(color));
    stack.addSpacer();
    //  进度条
    stack.addImage(this.wideProgressBar());

    const extraData = this.getWidgetData(this.settings.smallStyle_1 || `年度电量`)
    if (extraData) {
      const extraDataStack = stack.addStack();
      extraDataStack.centerAlignContent();
      const extraTitle = extraDataStack.addText(extraData[0]);
      extraDataStack.addSpacer();
      const extraValue = extraDataStack.addText(extraData[1]);
      const extraUnit = extraDataStack.addText(extraData[2]);
      extraTitle.font = Font.regularRoundedSystemFont(12 * this.SCALE);
      extraUnit.font = Font.regularRoundedSystemFont(12 * this.SCALE);
      extraValue.font = Font.regularRoundedSystemFont(14 * this.SCALE);
      [extraTitle, extraValue, extraUnit].map(t => {
        t.textColor = new Color(color);
      });
    }

    stack.addSpacer();
    //  余额
    let balance = this.balance;
    let balanceTitle = this.isOverdue ? '电费欠费' : '电费余额';
    if (!this.isOverdue && this.isPostPaid) {
      balance = this.settings.showBalance === 'true' ? this.remainFee : this.monthFee;
      balanceTitle = this.settings.showBalance === 'true' ? '电费余额' : '上期电费';
    };
    const downStack = stack.addStack();
    const titleStack = downStack.addStack();
    titleStack.layoutVertically();
    const balanceTitleText = titleStack.addText(balanceTitle);
    const balanceStack = titleStack.addStack();
    const balanceText = balanceStack.addText(`${balance}`);
    balanceStack.addSpacer(1);
    this.unit(balanceStack, '元', 8.5 * this.SCALE, new Color(color))
    balanceTitleText.font = Font.systemFont(12 * this.SCALE);
    balanceTitleText.textOpacity = 0.7;
    balanceText.font = Font.semiboldRoundedSystemFont(20 * this.SCALE);
    [balanceTitleText, balanceText].map(t => {
      t.textColor = new Color(color);
    });
    downStack.addSpacer();
    let wsgw = downStack.addImage(await this.getLogo());
    wsgw.tintColor = new Color(color);
    wsgw.imageSize = new Size(36 * this.SCALE, 36 * this.SCALE);
  };
  
  setWidgetStyle_4 (stack, color) {

    const step = this.stepEleText();

    const gaugeImage = this.gaugeChart();
    const bodyStack = stack.addStack();
    const mainColor = new Color(this.lastColor);
    bodyStack.layoutVertically();
    bodyStack.backgroundImage = gaugeImage;
    bodyStack.addSpacer();

    const arr = this.getWidgetData(this.settings.smallStyle_4 || '本月电量');
    if (arr === '自定户名') {
      const iconStack = bodyStack.addStack();
      iconStack.addSpacer();
      const iconSFS = SFSymbol.named('house.fill');
      iconSFS.applyHeavyWeight();
      let icon = iconStack.addImage(iconSFS.image);
      icon.tintColor = mainColor;
      icon.imageSize = new Size(24 * this.SCALE, 24 * this.SCALE);
      iconStack.addSpacer();
      bodyStack.addSpacer(3 * this.SCALE);
      const nameStack = bodyStack.addStack();
      nameStack.addSpacer();
      const name = nameStack.addText(this.name || '国家电网');
      nameStack.addSpacer();
      name.font = Font.mediumSystemFont(16 * this.SCALE);
      name.textColor = mainColor;
    } else if(arr === '阶梯电量') {
      const progress = step.progress;
      const icon = step.icon;
      this.createCenteredStack(bodyStack, '阶梯电量', mainColor);
      bodyStack.addSpacer(5 * this.SCALE);
      this.createCenteredText(bodyStack, progress, '', 4, 16 * this.SCALE, mainColor, 1, icon);
    } else {
      this.createCenteredStack(bodyStack, arr[0], mainColor);
      bodyStack.addSpacer(5 * this.SCALE);
      this.createCenteredText(bodyStack, arr[1], arr[2], 5, 16 * this.SCALE, mainColor, 1);
    };

    bodyStack.addSpacer(10 * this.SCALE);

    this.setUpdateStack(bodyStack, mainColor);

    bodyStack.addSpacer(6 * this.SCALE);

    const downStack = bodyStack.addStack();
    downStack.setPadding(0, 15 * this.SCALE, 5 * this.SCALE, 15 * this.SCALE)
    const gradient = new LinearGradient();
    gradient.locations = [0, 1];
    gradient.colors = [
      new Color('#00706C', 0),
      new Color('#00706C', 0.05)
    ];
    gradient.startPoint = new Point(0, 0);
    gradient.endPoint = new Point(0, 1);
    downStack.cornerRadius = 12 * this.SCALE;
    downStack.backgroundGradient = gradient;
    downStack.layoutVertically();
    downStack.centerAlignContent();
    let balance = this.balance;
    let balanceTitle = this.isOverdue ? '电费欠费' : '电费余额';
    if (!this.isOverdue && this.isPostPaid) {
      balance = this.settings.showBalance === 'true' ? this.remainFee : this.monthFee;
      balanceTitle = this.settings.showBalance === 'true' ? '电费余额' : '上期电费';
    };
    const titleStack = downStack.addStack();
    titleStack.addSpacer();
    const balanceTitleText = titleStack.addText(balanceTitle);
    titleStack.addSpacer();
    const balanceStack = downStack.addStack();
    balanceStack.addSpacer();
    const balanceText = balanceStack.addText(`${balance}`);
    this.unit(balanceStack, '元', 8 * this.SCALE, this.widgetColor)
    balanceStack.addSpacer();
    balanceTitleText.font = Font.systemFont(12 * this.SCALE);
    balanceTitleText.textOpacity = 0.7;
    balanceText.font = Font.semiboldRoundedSystemFont(20 * this.SCALE);
    [balanceTitleText, balanceText].map(t => {
      t.textColor = this.widgetColor;
    });
  };

  renderSmall = async (w) => {
    const padding = 12 * this.SCALE;
    w.setPadding(padding, padding, padding, padding);
    const bodyStack = w.addStack();
    const smallColor = this.smallStackColor;
    bodyStack.layoutVertically();
    if (this.widgetStyle ==='1') {
      bodyStack.setPadding(3 * this.SCALE, 3 * this.SCALE, 3 * this.SCALE, 3 * this.SCALE);
      await this.setWidgetStyle_1(bodyStack);
    } else if (this.widgetStyle ==='2') {
      await this.setWidgetStyle_2(bodyStack);
    } else if (this.widgetStyle ==='3') {
      bodyStack.setPadding(3 * this.SCALE, 3 * this.SCALE, 3 * this.SCALE, 3 * this.SCALE);
      await this.setWidgetStyle_3(bodyStack, smallColor);
    } else {
      this.setWidgetStyle_4(bodyStack, smallColor);
    };
    return w;
  };

  renderMedium = async (w) => {
    w.setPadding(0, 0, 0, 0);
    w.backgroundColor = Color.dynamic(new Color(this.settings.rightDayColor || "#E2E2E7"), new Color(this.settings.rightNightColor || "#2C2C2F"));
    const updateColor = new Color('#2F6E6B');
    const bodyStack = w.addStack();
    //  左侧stack
    const leftStack = bodyStack.addStack();
    leftStack.layoutVertically();
    leftStack.setPadding(0, 15, 0, 15);
    leftStack.size = new Size(this.size.leftStack / this.SCALE, 0);
    leftStack.backgroundColor = Color.dynamic(new Color(this.settings.leftDayColor || "#F2F2F7"), new Color(this.settings.leftNightColor || "#1C1C1E"));
    //  标题及LOGO
    if (this.settings.enableName === 'true')  {
      leftStack.addSpacer(15);
      this.setTitle(leftStack, new Color('#0db38e'), this.widgetColor);
    } else {
      leftStack.addSpacer();
      const logoStack = leftStack.addStack();
      logoStack.addSpacer();
      let wsgw = logoStack.addImage(await this.getLogo());
      wsgw.imageSize = new Size(this.size.logo, this.size.logo);
      logoStack.addSpacer();
    };
    leftStack.addSpacer();
    this.setUpdateStack(leftStack, updateColor);
    leftStack.addSpacer(2);
    const balanceStackBgcolor = Color.dynamic(new Color(this.settings.rightDayColor || "#E2E2E7"), new Color(this.settings.rightNightColor || "#2C2C2F"));
    this.setBalanceStack(leftStack, balanceStackBgcolor, 8 * this.SCALE, this.size.balance, this.size.smallFont, 4.5);
    leftStack.addSpacer(15);
    this.split(bodyStack, 0.5, 0, true);
    //  右侧Stack
    const rightStack = bodyStack.addStack();
    rightStack.setPadding(15, 15, 15, 15);
    rightStack.layoutVertically();
    //  Row
    this.setRow(rightStack, this.settings.firstRow || '组合一');
    rightStack.addSpacer();
    this.split(rightStack, 0, 0.5 * this.SCALE);
    rightStack.addSpacer();
    this.setRow(rightStack, this.settings.secondRow || '组合二');
    rightStack.addSpacer();
    this.split(rightStack, 0, 0.5 * this.SCALE);
    rightStack.addSpacer();
    this.setRow(rightStack, this.settings.thirdRow || '阶梯电量');

    return w;
  };
  // ######################################
  // ######################################
  init = async () => {
    try {
      if (this.settings.useICloud === 'true') this.fm = FileManager.iCloud();
      this.cachePath = this.fm.joinPath(this.fm.documentsDirectory(), this.CACHE_FOLDER);

      const scale = this.getWidgetScaleFactor();
      this.barHeight = scale >= 0.95 ? 20 : scale >= 0.90 ? 17.5 : scale >= 0.85 ? 15 : scale > 0.80 ? 12 : 12;
      this.SCALE = this.settings.SCALE || scale;

      Object.keys(this.wsgw).forEach(key => {
        this.wsgw[key] = this.settings[key] ? this.settings[key] : this.wsgw[key];
      });
      // 严格对接组件配置中 UI 的"刷新时间"（分钟）
      if (this.settings.interval) {
        const customInt = parseInt(this.settings.interval, 10);
        if (Number.isFinite(customInt) && customInt > 0) {
          this.wsgw.interval = customInt;
        }
      }

      // ===== 修复点 =====
      // 不要无条件用湖南阶梯阈值覆盖全局。
      // 如确是湖南月度阶梯，请在"显示配置 → 阶梯电量"里手动填写 step_2 / step_3。
      // const step = this.getStepsByCurrentMonth();
      // this.wsgw.step_2 = step.step_2;
      // this.wsgw.step_3 = step.step_3;
      // ==================

      Object.keys(this.size).forEach(key => {
        this.size[key] = this.settings[key] ? this.settings[key] : this.size[key];
        this.size[key] = this.size[key] * this.SCALE;
      });

    } catch (e) {
      console.log(e);
    }
    await this.getBillData();
  };
  
  getStepsByCurrentMonth() {
    const currentMonth = new Date().getMonth() + 1;
    const springAutumnMonths = [3, 4, 5, 9, 10, 11];
    if (springAutumnMonths.includes(currentMonth)) {
      return {
        step_2: 200,
        step_3: 350
      };
    } else {
      return {
        step_2: 200,
        step_3: 450
      };
    }
  };

  async render() {
    await this.init();
    const widget = new ListWidget();
    await this.getWidgetBackgroundImage(widget);
    
    // ⭐ 检查是否加载失败
    if (this.balance === "ERROR") {
      return this.renderErrorWidget(widget, '网络请求超时');
    }
    
    if (this.widgetFamily === 'medium') {
      return await this.renderMedium(widget);
    } else if (this.widgetFamily === 'large') {
      return await this.renderLarge(widget);
    } else {
      return await this.renderSmall(widget);
    }
  };

  // ⭐ 错误提示渲染方法（在小组件上显示友好错误信息）
  renderErrorWidget = (widget, errorMessage) => {
    const padding = 12 * this.SCALE;
    widget.setPadding(padding, padding, padding, padding);
    
    const mainStack = widget.addStack();
    mainStack.layoutVertically();
    mainStack.centerAlignContent();
    
    // 错误图标
    const iconStack = mainStack.addStack();
    iconStack.addSpacer();
    const iconSFS = SFSymbol.named('exclamationmark.triangle.fill');
    iconSFS.applyHeavyWeight();
    const icon = iconStack.addImage(iconSFS.image);
    icon.imageSize = new Size(40 * this.SCALE, 40 * this.SCALE);
    icon.tintColor = new Color('#FF9500');
    iconStack.addSpacer();
    
    mainStack.addSpacer(10 * this.SCALE);
    
    // 错误标题
    const titleStack = mainStack.addStack();
    titleStack.addSpacer();
    const title = titleStack.addText('数据加载失败');
    title.font = Font.semiboldSystemFont(14 * this.SCALE);
    title.textColor = this.widgetColor;
    titleStack.addSpacer();
    
    mainStack.addSpacer(5 * this.SCALE);
    
    // 错误提示
    const msgStack = mainStack.addStack();
    msgStack.addSpacer();
    const msg = msgStack.addText(errorMessage || '请检查网络或账户设置');
    msg.font = Font.systemFont(11 * this.SCALE);
    msg.textColor = this.widgetColor;
    msg.textOpacity = 0.7;
    msg.centerAlignText();
    msgStack.addSpacer();
    
    mainStack.addSpacer(10 * this.SCALE);
    
    // 缓存提示
    const cacheStack = mainStack.addStack();
    cacheStack.addSpacer();
    const lastCacheTime = this.getCacheModificationDate('BillData.json');
    const timeInterval = Math.floor((this.getCurrentTimeStamp() - lastCacheTime) / 60);
    let cacheText = '无缓存数据';
    if (lastCacheTime > 0) {
      if (timeInterval < 60) {
        cacheText = `缓存: ${timeInterval}分钟前`;
      } else if (timeInterval < 1440) {
        cacheText = `缓存: ${Math.floor(timeInterval / 60)}小时前`;
      } else {
        cacheText = `缓存: ${Math.floor(timeInterval / 1440)}天前`;
      }
    }
    const cache = cacheStack.addText(cacheText);
    cache.font = Font.systemFont(9 * this.SCALE);
    cache.textColor = this.widgetColor;
    cache.textOpacity = 0.5;
    cacheStack.addSpacer();
    
    return widget;
  };

  setColorConfig = async () => {
    return this.renderAppView([
      {
        title: '进度条颜色',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/barColor.png',
            type: 'color',
            title: '进度条颜色',
            defaultValue : '#0db38e',
            val: 'barColor',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/pointerColor.png',
            type: 'color',
            title: '指针颜色',
            defaultValue : '#0db38e',
            val: 'pointerColor',
          },
        ],
      },
      {
        title: '',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/chartColor.png',
            type: 'color',
            title: '图表颜色',
            defaultValue : '#0db38e',
            val: 'chartColor',
          },
        ],
      },
      {
        title: '背景颜色',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/leftDayColor.png',
            type: 'color',
            title: '左栏白天颜色',
            defaultValue : '#F2F2F7',
            val: 'leftDayColor',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/leftNightColor.png',
            type: 'color',
            title: '左栏晚上颜色',
            defaultValue : '#1C1C1E',
            val: 'leftNightColor',
          },
        ],
      },
      {
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/rightDayColor.png',
            type: 'color',
            title: '右栏白天颜色',
            defaultValue : '#E2E2E7',
            val: 'rightDayColor',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/rightNightColor.png',
            type: 'color',
            title: '右栏晚上颜色',
            defaultValue : '#2C2C2F',
            val: 'rightNightColor',
          },
        ],
      },
      {
        title: '重置颜色',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/clear.png',
            title: '重置颜色',
            desc: '重置当前颜色配置',
            name: 'reset',
            val: 'reset',
            onClick: () => {
              const propertiesToDelete = ['barColor', 'pointerColor', 'chartColor', 'leftDayColor', 'leftNightColor', 'rightDayColor', 'rightNightColor',];
              propertiesToDelete.forEach(prop => {
                delete this.settings[prop];
              });
              this.saveSettings();
              this.reopenScript();
            },
          },
        ],
      },
    ]).catch((e) => {
      console.log(e);
    });
  };

  setSizeConfig = async () => {
    return this.renderAppView([
      {
        title: '尺寸设置',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/SCALE.png',
            type: 'input',
            title: '全局缩放比例',
            placeholder : '1',
            desc: '不同机型会造成组件显示问题，适当调整该参数，如0.95、0.9，视小组件显示效果自行调整',
            val: 'SCALE',
          },
        ],
      },
      {
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/logo.png',
            type: 'input',
            title: 'LOGO大小',
            placeholder : '48',
            desc: '左栏LOGO尺寸，默认48',
            val: 'logo',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/leftStack.png',
            type: 'input',
            title: '左栏尺寸',
            placeholder : '130',
            desc: '默认130',
            val: 'leftStack',
          },
        ],
      },
      {
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/bigFont.png',
            type: 'input',
            title: '大号文字',
            placeholder : '18',
            desc: '默认18',
            val: 'bigFont',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/smallFont.png',
            type: 'input',
            title: '小号文字',
            placeholder : '12',
            desc: '默认12',
            val: 'smallFont',
          },
        ],
      },
      {
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/balance.png',
            type: 'input',
            title: '余额尺寸',
            placeholder : '20',
            desc: '默认20',
            val: 'balance',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/subSpacer.png',
            type: 'input',
            title: '下标偏移',
            placeholder : '6.5',
            desc: '默认6.5',
            val: 'subSpacer',
          },
        ],
      },
      {
        title: '重置尺寸',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/clear.png',
            title: '重置尺寸',
            desc: '重置当前尺寸配置',
            name: 'reset',
            val: 'reset',
            onClick: () => {
              const propertiesToDelete = ['SCALE', 'logo', 'leftStack', 'bigFont', 'smallFont', 'balance', 'subSpacer', ];
              propertiesToDelete.forEach(prop => {
                delete this.settings[prop];
              });
              this.saveSettings();
              this.reopenScript();
            },
          },
        ],
      },
    ]).catch((e) => {
      console.log(e);
    });
  };

  setShowConfig = async () => {
    return this.renderAppView([
      {
        title: '中组件显示设置',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/firstRow.png',
            type: 'select',
            title: '第一栏显示内容',
            options: ['组合一', '组合二', '组合三', '阶梯电量'],
            val: 'firstRow',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/secondRow.png',
            type: 'select',
            title: '第二栏显示内容',
            options: ['组合二', '组合一', '组合三', '阶梯电量'],
            val: 'secondRow',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/thirdRow.png',
            type: 'select',
            title: '第三栏显示内容',
            options: ['阶梯电量', '组合一', '组合二', '组合三'],
            val: 'thirdRow',
          },
        ],
      },
      {
        title: '组合一显示内容',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/group1Left.png',
            type: 'select',
            title: '组合一左侧显示内容',
            options: ['上期电费', '上期电量', '年度电费', '年度电量', '日用电图表', '月用电图表', '近日用电', '本月电量', '电费余额', '不显示'],
            val: 'group1Left',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/group1Right.png',
            type: 'select',
            title: '组合一右侧显示内容',
            options: ['上期电量', '上期电费', '年度电费', '年度电量', '日用电图表', '月用电图表', '近日用电', '本月电量', '电费余额', '不显示'],
            val: 'group1Right',
          },
        ],
      },
      {
        title: '组合二显示内容',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/group2Left.png',
            type: 'select',
            title: '组合二左侧显示内容',
            options: ['年度电费', '年度电量', '上期电费', '上期电量', '日用电图表', '月用电图表', '近日用电', '本月电量', '电费余额', '不显示'],
            val: 'group2Left',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/group2Right.png',
            type: 'select',
            title: '组合二右侧显示内容',
            options: ['年度电量', '年度电费', '上期电费', '上期电量', '日用电图表', '月用电图表', '近日用电', '本月电量', '电费余额', '不显示'],
            val: 'group2Right',
          },
        ],
      },
      {
        title: '组合三显示内容',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/group3Left.png',
            type: 'select',
            title: '组合三左侧显示内容',
            options: ['年度电费', '年度电量', '上期电费', '上期电量', '日用电图表', '月用电图表', '近日用电', '本月电量', '电费余额', '不显示'],
            val: 'group3Left',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/group3Right.png',
            type: 'select',
            title: '组合三右侧显示内容',
            options: ['年度电量', '年度电费', '上期电费', '上期电量', '日用电图表', '月用电图表', '近日用电', '本月电量', '电费余额', '不显示'],
            val: 'group3Right',
          },
        ],
      },
      {
        title: '',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/dayAmount.png',
            type: 'select',
            title: '日用电图表显示天数',
            options: ['5', '6', '7', '8', '9', '10', '11', '12'],
            val: 'dayAmount',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/monthAmount.png',
            type: 'select',
            title: '月用电图表显示月数',
            options: ['5', '6', '7', '8', '9', '10', '11', '12'],
            val: 'monthAmount',
          },
        ],
      },
      {
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/balance.png',
            type: 'switch',
            title: '后付费用户左栏显示余额',
            desc: '',
            val: 'showBalance',
          },
        ],
      },
      {
        title: '小组件显示设置',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/smallLeft.png',
            type: 'select',
            title: '小组件1、3显示内容',
            options: ['年度电量', '年度电费', '上期电费', '上期电量', '近日用电', '本月电量', '电费余额'],
            val: 'smallStyle_1',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/smallLeft.png',
            type: 'select',
            title: '小组件4显示内容',
            options: ['年度电量', '年度电费', '上期电费', '上期电量', '近日用电', '本月电量', '电费余额', '阶梯电量', '自定户名'],
            val: 'smallStyle_4',
          },
        ],
      },
      {
        title: '',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/smallStyle_2_up.png',
            type: 'select',
            title: '小组件2显示内容1',
            options: ['年度电费', '年度电量', '上期电费', '上期电量', '近日用电', '本月电量', '电费余额'],
            val: 'smallStyle_2_up',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/smallStyle_2_down.png',
            type: 'select',
            title: '小组件2显示内容2',
            options: ['年度电费', '年度电量', '上期电费', '上期电量', '近日用电', '本月电量', '电费余额'],
            val: 'smallStyle_2_down',
          },
        ],
      },
      {
        title: '图片设置',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/logoImg.png',
            type: 'select',
            title: 'LOGO显示',
            options: ['国家电网', '铁塔', '自定义', '不显示'],
            val: 'logoImg',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/customizeUrl.png',
            type: 'input',
            title: '自定义',
            desc: '自定义显示图片URL地址，建议透明PNG图片，更改自定图片前需清除缓存',
            val: 'customizeUrl',
          },
        ],
      },
      {
        title: '阶梯电量',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/stepMode.png',
            type: 'select',
            title: '阶梯电量计算方式',
            options: ['年', '月', '双月'],
            desc: '',
            val: 'stepMode',
          },
        ],
      },
      {
        title: '',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/step_2.png',
            type: 'input',
            title: '二档电量',
            placeholder : '2520',
            desc: '第二档阶梯电量，默认为2520，各地数据以国网app为准',
            val: 'step_2',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/step_3_month.png',
            type: 'input',
            title: '三档电量',
            placeholder : '4800',
            desc: '第三档阶梯电量，默认为4800，各地数据以国网app为准',
            val: 'step_3',
          },
        ],
      },
    ]).catch((e) => {
      console.log(e);
    });
  };

  setUserConfig = async () => {
    return this.renderAppView([
      {
        title: '',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/enableName.png',
            title: '中组件开启户名显示',
            type: 'switch',
            val: 'enableName',
          },
        ],
      },
      {
        title: '多户配置',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/name.png',
            type: 'input',
            title: '户名一',
            desc: '自定义小尺寸组件标题，替代默认"国家电网"',
            val: 'name',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/widgetStyle.png',
            type: 'select',
            title: '小组件样式',
            options: ['1', '2', '3', '4'],
            val: 'widgetStyle',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/smallStackColor.png',
            type: 'color',
            defaultValue : '#3A9690',
            title: '小组件颜色1',
            val: 'smallStackColor',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/smallStackColor.png',
            type: 'color',
            defaultValue : '#3A9690',
            title: '小组件颜色2',
            val: 'endColor',
          },
        ],
      },
      {
        title: '',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/name_1.png',
            type: 'input',
            title: '户名二',
            desc: '自定义小尺寸组件标题，替代默认"国家电网"',
            val: 'name_1',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/widgetStyle_1.png',
            type: 'select',
            title: '小组件样式',
            options: ['1', '2', '3', '4'],
            val: 'widgetStyle_1',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/smallStackColor_1.png',
            type: 'color',
            defaultValue : '#3A9690',
            title: '小组件颜色1',
            val: 'smallStackColor_1',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/smallStackColor_1.png',
            type: 'color',
            defaultValue : '#3A9690',
            title: '小组件颜色2',
            val: 'endColor_1',
          },
        ],
      },
      {
        title: '',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/name_2.png',
            type: 'input',
            title: '户名三',
            desc: '自定义小尺寸组件标题，替代默认"国家电网"',
            val: 'name_2',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/widgetStyle_2.png',
            type: 'select',
            title: '小组件样式',
            options: ['1', '2', '3', '4'],
            val: 'widgetStyle_2',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/smallStackColor_2.png',
            type: 'color',
            defaultValue : '#3A9690',
            title: '小组件颜色1',
            val: 'smallStackColor_2',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/smallStackColor_2.png',
            type: 'color',
            defaultValue : '#3A9690',
            title: '小组件颜色2',
            val: 'endColor_2',
          },
        ],
      },
      {
        title: '重置颜色',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/clear.png',
            title: '重置颜色',
            desc: '重置当前颜色配置',
            name: 'reset',
            val: 'reset',
            onClick: () => {
              const propertiesToDelete = ['smallStackColor', 'endColor', 'smallStackColor_1', 'endColor_1', 'smallStackColor_2', 'endColor_2'];
              propertiesToDelete.forEach(prop => {
                delete this.settings[prop];
              });
              this.saveSettings();
              this.reopenScript();
            },
          },
        ],
      },
    ]).catch((e) => {
      console.log(e);
    });
  };

  setAccountConfig = async () => {
    const promptInput = async (title, desc, key, placeholder) => {
      const a = new Alert();
      a.title = String(title || '');
      a.message = String(desc || '');
      const isSms = key === 'smsCode';
      const cur = isSms ? '' : String(this.settings[key] || '');
      a.addTextField(String(placeholder || ''), cur);
      a.addAction('确定');
      a.addCancelAction('取消');
      const res = await a.presentAlert();
      if (res === 0) {
        const val = String(a.textFieldValue(0) || '').trim();
        this.settings[key] = val;
        if (key === 'smsCode') {
          const curPhone = (this.settings.phone || '').trim().replace(/^(\+?86)?\s*/, '').replace(/\D/g, '');
          if (curPhone) secretSet('inputSMS.' + md5hex(curPhone), val);
        }
        this.saveSettings(false);
      }
    };

    return this.renderAppView([
      {
        title: '国网 App 官方接口配置 (直连免重写)',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/name.png',
            type: 'input',
            title: '手机号',
            desc: '网上国网 App 登录手机号',
            placeholder: '请输入手机号',
            val: 'phone',
            onClick: async () => {
              await promptInput('网上国网手机号', '请输入登录网上国网 App 的手机号', 'phone', '手机号');
              this.reopenScript();
            }
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/balance.png',
            type: 'input',
            title: '登录密码',
            desc: '网上国网 App 登录密码',
            placeholder: '请输入密码',
            val: 'password',
            onClick: async () => {
              await promptInput('网上国网登录密码', '请输入登录密码（在国网App中使用的密码）', 'password', '密码');
              this.reopenScript();
            }
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/login.png',
            type: 'input',
            title: '发送短信验证码',
            desc: '填好上方手机号和密码后，点击向手机发送短信验证码',
            val: 'send_sms',
            onClick: async () => {
              const phone = (this.settings.phone || '').trim().replace(/^(\+?86)?\s*/, '').replace(/\D/g, '');
              const password = (this.settings.password || '').trim();
              if (!phone || !password) {
                const tipAlert = new Alert();
                tipAlert.title = '提示';
                tipAlert.message = '请先填写上方的「手机号」与「登录密码」，然后再点击发送验证码！';
                tipAlert.addAction('知道了');
                await tipAlert.presentAlert();
                return;
              }

              const waitAlert = new Alert();
              waitAlert.title = '正在请求国网发送短信...';
              waitAlert.message = '请稍候片刻';

              const self = this;
              const ctx = {
                env: { SGCC_SMS: '' },
                storage: {
                  getJSON: (k) => {
                    if (sensitiveKey(k)) return secretGet('state.' + k);
                    try {
                      const s = self.loadStringCache(`sgcc_${k}.json`);
                      return s ? JSON.parse(s) : null;
                    } catch (_) { return null; }
                  },
                  setJSON: (k, v) => {
                    if (sensitiveKey(k)) {
                      secretSet('state.' + k, v);
                      return;
                    }
                    try {
                      self.saveStringCache(`sgcc_${k}.json`, JSON.stringify(v));
                    } catch (_) {}
                  }
                },
                http: {
                  post: async (url, req) => {
                    const r = new Request(url);
                    r.method = 'POST';
                    const safeHeaders = {};
                    const rawH = req.headers || {};
                    for (const [hk, hv] of Object.entries(rawH)) {
                      safeHeaders[hk] = hv == null ? '' : String(hv);
                    }
                    r.headers = safeHeaders;
                    const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || '');
                    r.body = bodyStr;
                    r.timeoutInterval = (req.timeout || 20000) / 1000;
                    try {
                      const text = await r.loadString();
                      const status = r.response ? r.response.statusCode : 200;
                      return {
                        status,
                        text: async () => text
                      };
                    } catch (netErr) {
                      console.error('发送验证码网络异常: ' + (netErr.message || netErr));
                      throw netErr;
                    }
                  }
                }
              };

              try {
                const app = new SgccProtocol.SgApp(ctx, phone, password);
                const codeKey = await app.sendDeviceSms();
                app.st(app.sk(SgccProtocol.K.sms), { user: app.user, codeKey, ts: Date.now(), used: '' });
                const successAlert = new Alert();
                successAlert.title = '短信验证码已发送';
                successAlert.message = `验证码已成功发至手机号 ${phone.slice(0, 3)}****${phone.slice(-4)}，请查收后填入下方「新设备短信验证码」并刷新！`;
                successAlert.addAction('确定');
                await successAlert.presentAlert();
              } catch (err) {
                const errAlert = new Alert();
                errAlert.title = '发送失败';
                errAlert.message = `国网短信下发异常：${err.message || err}`;
                errAlert.addAction('确定');
                await errAlert.presentAlert();
              }
            }
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/update.png',
            type: 'input',
            title: '新设备短信验证码',
            desc: '小组件提示新设备验证时填入收到的6位验证码',
            placeholder: '6位数字验证码',
            val: 'smsCode',
            onClick: async () => {
              await promptInput('短信验证码', '填入收到的6位短信验证码后点击确定并刷新', 'smsCode', '6位验证码');
              this.reopenScript();
            }
          },
        ],
      },
      {
        title: '操作',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/reload.png',
            title: '立即刷新数据',
            desc: '清空本地数据缓存并立即重新连国网查询',
            name: 'reload_now',
            val: 'reload_now',
            onClick: async () => {
              try {
                const cacheFile = this.fm.joinPath(this.cachePath, 'BillData.json');
                if (this.fm.fileExists(cacheFile)) this.fm.remove(cacheFile);
              } catch (_) {}
              this.reopenScript();
            },
          },
        ],
      },
    ]).catch((e) => {
      console.log(e);
    });
  };

  Run() {
    if (config.runsInApp) {
      this.registerAction({
        title: '组件配置',
        menu: [
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/useICloud.png',
            type: 'switch',
            title: 'iCloud',
            val: 'useICloud',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/update.png',
            type: 'input',
            title: '脚本更新',
            name: 'update',
            onClick: async () => {
              await this.checkAndUpdateScript();
            },
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/interval.png',
            type: 'input',
            placeholder : '360',
            title: '刷新时间',
            desc: '电费数据刷新时间，单位：分钟，默认360分钟',
            val: 'interval',
          },
          {
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/reset.png',
            title: '清除缓存',
            desc: '',
            val: 'reset',
            onClick: async () => {
              const alert = new Alert();
              alert.title = '清除缓存';
              alert.message = '将清空账单数据与登录会话缓存，重新获取最新数据。确定清除吗？';
              alert.addAction('确认清除');
              alert.addCancelAction('取消');
              const res = await alert.presentAlert();
              if (res === 0) {
                try {
                  const targetPath = this.getCachePath();
                  const targetFm = (this.settings && this.settings.useICloud === 'true') ? FileManager.iCloud() : FileManager.local();
                  if (targetFm.fileExists(targetPath)) {
                    targetFm.remove(targetPath);
                  }
                  // 清理 Keychain 中的会话缓存（保留设备指纹以防触发陌生设备风控）
                  const curPhone = (this.settings && this.settings.phone || '').trim().replace(/^(\+?86)?\s*/, '').replace(/\D/g, '');
                  if (curPhone) {
                    const u = md5hex(curPhone).slice(0, 8);
                    secretDel('state.sgcc_app_sess_' + u);
                    secretDel('state.sgcc_app_sms_' + u);
                    secretDel('inputSMS.' + md5hex(curPhone));
                  }
                  const success = new Alert();
                  success.title = '清除成功';
                  success.message = '缓存已清空，请重新打开脚本或刷新数据！';
                  success.addAction('确定');
                  await success.presentAlert();
                  this.reopenScript();
                } catch (e) {
                  console.error('清除缓存异常: ' + (e.message || e));
                }
              }
            },
          },
        ],
      });
      this.registerAction({
        title: '',
        menu: [
          {
            name: 'color',
            title: '颜色配置',
            url: 'https://pic1.imgdb.cn/item/63315c1e16f2c2beb1a27363.png',
            type: 'input',
            onClick: () => {
              return this.setColorConfig();
            },
          },
          {
            name: 'size',
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/size.png',
            title: '尺寸配置',
            type: 'input',
            onClick: () => {
              return this.setSizeConfig();
            },
          },
          {
            name: 'show',
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/show.png',
            title: '显示配置',
            type: 'input',
            onClick: () => {
              return this.setShowConfig();
            },
          },
          {
            name: 'user',
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/user.png',
            title: '多户配置',
            type: 'input',
            onClick: () => {
              return this.setUserConfig();
            },
          },
          {
            name: 'account',
            title: '账户设置',
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/user.png',
            type: 'input',
            onClick: () => {
              return this.setAccountConfig();
            },
          },
        ],
      });

      this.registerAction({
        title: '',
        menu: [
          {
            name: 'basic',
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/basic.png',
            title: '基础设置',
            type: 'input',
            onClick: () => {
              return this.setWidgetConfig();
            },
          },
          {
            name: 'reload',
            url: 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/reload.png',
            title: '重载组件',
            type: 'input',
            onClick: () => {
              this.reopenScript();
            },
          },
        ],
      });
     }
  };
};

await Runing(Widget, args.widgetParameter, false);
