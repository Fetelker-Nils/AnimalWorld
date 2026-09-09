// Indoor geometry uses a depth buffer: walls occlude furniture and Mauz per pixel.
function createIndoorRenderer(){
  const surface=document.createElement('canvas');
  const gl=surface.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true});
  if(!gl)throw Error('Die Innenraum-Grafik konnte nicht gestartet werden.');
  const program=gl.createProgram();
  for(const [type,source] of [[gl.VERTEX_SHADER,`attribute vec4 position;attribute vec3 color;attribute vec2 uv;varying vec3 tint;varying vec2 tex;void main(){gl_Position=position;tint=color;tex=uv;}`],[gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 tint;varying vec2 tex;uniform sampler2D sprite;uniform bool textured;void main(){if(textured){vec4 c=texture2D(sprite,tex);if(c.a<0.05)discard;gl_FragColor=c;}else gl_FragColor=vec4(tint,1.0);}`]]){
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program,shader);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [name,size,offset] of [['position',4,0],['color',3,16],['uv',2,28]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,36,offset);}
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const textured=gl.getUniformLocation(program,'textured');
  return {surface,render({width,height,scale,cx,cy,point,boxes,floors,sprite,catDepth,extras=[],mesh=[]}){
    if(surface.width!==sprite.width||surface.height!==sprite.height){surface.width=sprite.width;surface.height=sprite.height;}
    gl.viewport(0,0,surface.width,surface.height);gl.clearColor(.87,.86,.81,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.uniform1i(textured,0);
    const vertices=[],near=.1,far=150,A=(far+near)/(far-near),B=-2*far*near/(far-near);
    function quad(coords,color,shade=1){
      const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255*shade);
      for(const i of [0,1,2,0,2,3]){const p=point(...coords[i]);vertices.push(2*scale/width*p.u+(2*cx/width-1)*p.depth,2*scale/height*p.v+(1-2*cy/height)*p.depth,A*p.depth+B,p.depth,...rgb,0,0);}
    }
    for(const b of floors){const x=b.x,y=b.y,w=b.w/2,d=b.d/2,z=b.z||0;quad([[x-w,y-d,z],[x+w,y-d,z],[x+w,y+d,z],[x-w,y+d,z]],b.color);}
    for(const b of boxes){const x=b.x,y=b.y,w=b.w/2,d=b.d/2,h=b.h;const c=[[x-w,y-d],[x+w,y-d],[x+w,y+d],[x-w,y+d]];
      for(let i=0;i<4;i++){const a=c[i],e=c[(i+1)%4];quad([[...a,0],[...e,0],[...e,h],[...a,h]],b.color,i%2?.9:.97);}
      quad(c.map(p=>[...p,h]),b.top||b.color);
    }
    for(const f of mesh){const rgb=[1,3,5].map(i=>parseInt(f.color.slice(i,i+2),16)/255);for(let i=1;i<f.points.length-1;i++)for(const v of [f.points[0],f.points[i],f.points[i+1]]){const p=point(...v);vertices.push(2*scale/width*p.u+(2*cx/width-1)*p.depth,2*scale/height*p.v+(1-2*cy/height)*p.depth,A*p.depth+B,p.depth,...rgb,0,0);}}
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/9);
    gl.uniform1i(textured,1);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    for(const layer of [{depth:catDepth},...extras]){
    if(layer.draw)layer.draw();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,sprite);
    const z=A+B/layer.depth,overlay=[];
    for(const [x,y] of [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])overlay.push(x,y,z,1,1,1,1,(x+1)/2,(y+1)/2);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(overlay),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,6);
    }
  }};
}
