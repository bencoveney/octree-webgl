#version 300 es

in vec4 aVertexPosition;
in vec3 aVertexNormal;
in vec4 aVertexColor;

uniform mat4 uNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

uniform vec3 uAmbientLightColor;
uniform vec3 uDirectionalLightColor;
uniform vec3 uDirectionalLightDirection;

out vec4 vColor;
out vec3 vLighting;

void main(void) {
	gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
	vColor = aVertexColor;
	vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
	float directional = max(dot(transformedNormal.xyz, normalize(uDirectionalLightDirection)), 0.0);
	vLighting = uAmbientLightColor + (uDirectionalLightColor * directional);
}