#version 300 es

precision lowp float;

in vec4 color;
in vec3 lighting;

out vec4 outputColor;

void main(void) {
	outputColor = color * vec4(lighting, 1);
}