export type ShaderProgramInfo = {
  program: WebGLProgram;
  attributeLocations: { [attributeName: string]: number };
  uniformLocations: { [attributeName: string]: WebGLUniformLocation };
};

export type Shaders = {
  tri: ShaderProgramInfo;
  line: ShaderProgramInfo;
};

export function initialiseShaders(gl: WebGLRenderingContext): Shaders {
  return { tri: initialiseTriShaders(gl), line: initialiseLineShaders(gl) };
}

function initialiseTriShaders(gl: WebGLRenderingContext): ShaderProgramInfo {
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
      projectionMatrix: getUniformLocation(
        gl,
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: getUniformLocation(
        gl,
        shaderProgram,
        "uModelViewMatrix"
      ),
      normalMatrix: getUniformLocation(gl, shaderProgram, "uNormalMatrix"),
      ambientLightColor: getUniformLocation(
        gl,
        shaderProgram,
        "uAmbientLightColor"
      ),
      directionalLightColor: getUniformLocation(
        gl,
        shaderProgram,
        "uDirectionalLightColor"
      ),
      directionalLightDirection: getUniformLocation(
        gl,
        shaderProgram,
        "uDirectionalLightDirection"
      )
    }
  };
}

function initialiseLineShaders(gl: WebGLRenderingContext): ShaderProgramInfo {
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
      projectionMatrix: getUniformLocation(
        gl,
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: getUniformLocation(gl, shaderProgram, "uModelViewMatrix")
    }
  };
}

function createShader(
  gl: WebGLRenderingContext,
  shaderName: string,
  shaderType: number
): WebGLShader {
  const shader = gl.createShader(shaderType);

  if (shader === null) {
    throw new Error("Unable to create shader");
  }

  const shaderSource = require(`./shaders/${shaderName}.glsl`);
  gl.shaderSource(shader, shaderSource);

  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    gl.deleteShader(shader);
    throw new Error("could not compile shader: " + gl.getShaderInfoLog(shader));
  }

  return shader;
}

function createShaderProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram {
  const program = gl.createProgram();
  if (program === null) {
    throw new Error("Unable to create program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.validateProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    gl.deleteProgram(program);
    throw new Error("Program failed to link: " + gl.getProgramInfoLog(program));
  }

  return program;
}

function getUniformLocation(
  gl: WebGLRenderingContext,
  shaderProgram: WebGLProgram,
  name: string
) {
  const location = gl.getUniformLocation(shaderProgram, name);

  if (location === null) {
    throw new Error(`Unable to find uniform ${name}`);
  }

  return location;
}
