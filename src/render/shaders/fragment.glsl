#version 300 es

precision lowp float;

in vec4 vColor;
in vec3 vLighting;

out vec4 outputColor;

void main(void) {
	outputColor = vColor * vec4(vLighting, 1);
}