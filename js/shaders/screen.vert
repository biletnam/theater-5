attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
uniform float u_scaleF;
uniform vec2 u_translation;
varying vec2 u_resolution;

void main() {
  // multiple u_scale is 0.5 then this works as expected:
  vec2 position = (a_position * u_scaleF) + u_translation;
  // flip it right-side up:
  position.y = 1.0 - position.y;
  // pass the texCoord to the fragment shader
  // The GPU will interpolate this value between points.
  v_texCoord = a_texCoord;
  gl_Position = vec4((vec2(2.0, 2.0) * position - vec2(1.0, 1.0)), 0.0, 1.0);
}
