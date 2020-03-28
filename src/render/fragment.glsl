varying lowp vec4 vColor;
varying lowp vec3 vLighting;

void main(void) {
	gl_FragColor = vColor * vec4(vLighting, 1);
}