#version 300 es

in vec4 vertexPosition;
in vec4 vertexColor;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

out vec4 color;

void main(void) {
	gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;

	color = vertexColor;
}