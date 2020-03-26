export type ShaderProgramInfo = {
  program: WebGLProgram;
  attributeLocations: { [attributeName: string]: number };
  uniformLocations: { [attributeName: string]: WebGLUniformLocation };
};

export function initialiseShaders(
  gl: WebGLRenderingContext
): ShaderProgramInfo {
  const vertexShader = createShader(gl, "vertex", gl.VERTEX_SHADER);
  const fragmentShader = createShader(gl, "fragment", gl.FRAGMENT_SHADER);
  const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);

  return {
    program: shaderProgram,
    attributeLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
      vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal")
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix")
    }
  };
}

export function initialiseLineShaders(
  gl: WebGLRenderingContext
): ShaderProgramInfo {
  const vertexShader = createShader(gl, "lineVertex", gl.VERTEX_SHADER);
  const fragmentShader = createShader(gl, "lineFragment", gl.FRAGMENT_SHADER);
  const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);

  return {
    program: shaderProgram,
    attributeLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor")
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")
    }
  };
}

export function createShader(
  gl: WebGLRenderingContext,
  shaderName: string,
  shaderType: number
): WebGLShader {
  const shader = gl.createShader(shaderType);

  const shaderSource = require(`./${shaderName}.glsl`);
  gl.shaderSource(shader, shaderSource);

  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    gl.deleteShader(shader);
    throw new Error("could not compile shader: " + gl.getShaderInfoLog(shader));
  }

  return shader;
}

export function createShaderProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.validateProgram(program);

  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    gl.deleteProgram(program);
    throw new Error("program failed to link: " + gl.getProgramInfoLog(program));
  }

  return program;
}
