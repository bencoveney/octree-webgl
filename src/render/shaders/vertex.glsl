attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec4 aVertexColor;

uniform mat4 uNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

uniform vec3 uAmbientLightColor;
uniform vec3 uDirectionalLightColor;
uniform vec3 uDirectionalLightDirection;

varying lowp vec4 vColor;
varying lowp vec3 vLighting;

void main(void) {
	gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
	vColor = aVertexColor;
	lowp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
	lowp float directional = max(dot(transformedNormal.xyz, normalize(uDirectionalLightDirection)), 0.0);
	vLighting = uAmbientLightColor + (uDirectionalLightColor * directional);
}