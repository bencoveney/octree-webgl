varying lowp vec4 vColor;
varying highp vec3 vLighting;

void main(void) {
	gl_FragColor = vColor * vec4(vLighting, 1);
}