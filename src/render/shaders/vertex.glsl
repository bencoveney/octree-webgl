#version 300 es

in vec4 vertexPosition;
in vec3 vertexNormal;
in vec4 vertexColor;

uniform mat4 normalMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform vec3 ambientLightColor;
uniform vec3 directionalLightColor;
uniform vec3 directionalLightDirection;

out vec4 color;
out vec3 lighting;

void main(void) {
	gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;

	color = vertexColor;

	vec4 transformedNormal = normalMatrix * vec4(vertexNormal, 1.0);
	float directional = max(dot(transformedNormal.xyz, normalize(directionalLightDirection)), 0.0);
	lighting = ambientLightColor + (directionalLightColor * directional);
}