precision mediump float;
uniform vec2 u_resolution; // incoming resolution
uniform sampler2D u_video0; // incoming video
uniform float u_activeEffect; // index of the current effect
uniform float u_videoDuration; // time current video will end (used by effects)
uniform float u_currentTime; // current time
uniform vec2 u_mouse; // mouse
uniform float u_percentDone; // screw it

//////////////////////////
// flare effect stuff:
//////////////////////////
vec3 lensflare(vec2 uv, vec2 pos) {
	vec2 main = uv-pos;
	vec2 uvd = uv*(length(uv));

	float ang = atan(main.y, main.x);
	float dist = length(main);
  dist = pow(dist,.1);

	float f0 = 1.0/(length(uv-pos)*16.0+1.0);

	float f2 = max(1.0/(1.0+32.0*pow(length(uvd+0.8*pos),2.0)),.0)*00.25;
	float f22 = max(1.0/(1.0+32.0*pow(length(uvd+0.85*pos),2.0)),.0)*00.23;
	float f23 = max(1.0/(1.0+32.0*pow(length(uvd+0.9*pos),2.0)),.0)*00.21;

	vec2 uvx = mix(uv,uvd,-0.5);

	float f4 = max(0.01-pow(length(uvx+0.4*pos),2.4),.0)*6.0;
	float f42 = max(0.01-pow(length(uvx+0.45*pos),2.4),.0)*5.0;
	float f43 = max(0.01-pow(length(uvx+0.5*pos),2.4),.0)*3.0;

	uvx = mix(uv,uvd,-.4);

	float f5 = max(0.01-pow(length(uvx+0.2*pos),5.5),.0)*2.0;
	float f52 = max(0.01-pow(length(uvx+0.4*pos),5.5),.0)*2.0;
	float f53 = max(0.01-pow(length(uvx+0.6*pos),5.5),.0)*2.0;
	uvx = mix(uv,uvd,-0.5);
	float f6 = max(0.01-pow(length(uvx-0.3*pos),1.6),.0)*6.0;
	float f62 = max(0.01-pow(length(uvx-0.325*pos),1.6),.0)*3.0;
	float f63 = max(0.01-pow(length(uvx-0.35*pos),1.6),.0)*5.0;
	vec3 c = vec3(.0);
	c.r+=f2+f4+f5+f6; c.g+=f22+f42+f52+f62; c.b+=f23+f43+f53+f63;
	c+=vec3(f0);
	return c;
}

vec3 cc(vec3 color, float factor,float factor2) {
	float w = color.x+color.y+color.z;
	return mix(color,vec3(w)*factor,w*factor2);
}

vec4 flareEffect(vec2 fragCoord ) {
	vec2 uv = fragCoord.xy / u_resolution.xy;
	// uv.x *= u_resolution.x / u_resolution.y;
	vec3 mouse = vec3(u_mouse.xy / u_resolution.xy, .5);
  mouse.y = 1.0 - mouse.y;
  // mouse.x -= .2;
	// mouse.x *= u_resolution.x / u_resolution.y;
	// mouse.x=sin(u_currentTime)*.5;
	// mouse.y=sin(u_currentTime*.913)*.5;
	vec3 color = vec3(1.4, 1.2, 1.0) * lensflare(uv, mouse.xy);
	color = cc(color, .5, .1);
	return vec4(color, 1.0);
}

////////////////////////////
// B&W effect
////////////////////////////
vec4 bwSubtraction(vec2 mouse, vec2 fragCoord) {
  float dist = distance(mouse, fragCoord);
  float factor = .4 * u_percentDone;
  if (u_percentDone > .5) {
    factor = factor - (u_percentDone - .5);
  }
  float val = smoothstep(factor, .1, dist);
	return vec4(val, val, val, 0.0);
}

// returns pixel for a partial:
vec4 displayPartial(vec2 upperLeft, vec2 dimensions) {
	return vec4(0.0, 0.0, 0.0, 0.0);
}

///////////////////////
// main
///////////////////////
void main() {
  vec2 normalizedCoords = (gl_FragCoord.xy / u_resolution.xy);
  normalizedCoords.y = 1.0 - normalizedCoords.y;
  vec2 normalizedMouse = u_mouse.xy / u_resolution.xy;

  gl_FragColor = texture2D(u_video0, normalizedCoords);
  // mouse miss:
  if (u_activeEffect == 1.0) {
    vec4 flare = flareEffect(gl_FragCoord.xy);
    gl_FragColor = mix(flare, gl_FragColor, u_percentDone);
  }
  if (u_activeEffect == 2.0) {
    vec4 bw = bwSubtraction(normalizedCoords, normalizedMouse);
    gl_FragColor -= bw;
  }
}
