export enum AttributeLocations {
  vertexPosition = 0,
  vertexColor = 1,
  vertexNormal = 2,
}

export type ShaderProgramInfo = {
  program: WebGLProgram;
  uniformLocations: { [attributeName: string]: WebGLUniformLocation };
};

export type Shaders = {
  tri: ShaderProgramInfo;
  line: ShaderProgramInfo;
};

export function initialiseShaders(gl: WebGL2RenderingContext): Shaders {
  return { tri: initialiseTriShaders(gl), line: initialiseLineShaders(gl) };
}

function initialiseTriShaders(gl: WebGL2RenderingContext): ShaderProgramInfo {
  const vertexShader = createShader(gl, "vertex", gl.VERTEX_SHADER);
  const fragmentShader = createShader(gl, "fragment", gl.FRAGMENT_SHADER);
  const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);

  setAttributeLocation(gl, shaderProgram, AttributeLocations.vertexPosition);
  setAttributeLocation(gl, shaderProgram, AttributeLocations.vertexColor);
  setAttributeLocation(gl, shaderProgram, AttributeLocations.vertexNormal);

  return {
    program: shaderProgram,
    uniformLocations: {
      projectionMatrix: getUniformLocation(
        gl,
        shaderProgram,
        "projectionMatrix"
      ),
      modelViewMatrix: getUniformLocation(gl, shaderProgram, "modelViewMatrix"),
      normalMatrix: getUniformLocation(gl, shaderProgram, "normalMatrix"),
      ambientLightColor: getUniformLocation(
        gl,
        shaderProgram,
        "ambientLightColor"
      ),
      directionalLightColor: getUniformLocation(
        gl,
        shaderProgram,
        "directionalLightColor"
      ),
      directionalLightDirection: getUniformLocation(
        gl,
        shaderProgram,
        "directionalLightDirection"
      ),
    },
  };
}

function initialiseLineShaders(gl: WebGL2RenderingContext): ShaderProgramInfo {
  const vertexShader = createShader(gl, "lineVertex", gl.VERTEX_SHADER);
  const fragmentShader = createShader(gl, "lineFragment", gl.FRAGMENT_SHADER);
  const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);

  setAttributeLocation(gl, shaderProgram, AttributeLocations.vertexPosition);
  setAttributeLocation(gl, shaderProgram, AttributeLocations.vertexColor);

  return {
    program: shaderProgram,
    uniformLocations: {
      projectionMatrix: getUniformLocation(
        gl,
        shaderProgram,
        "projectionMatrix"
      ),
      modelViewMatrix: getUniformLocation(gl, shaderProgram, "modelViewMatrix"),
    },
  };
}

function createShader(
  gl: WebGL2RenderingContext,
  shaderName: string,
  shaderType: number
): WebGLShader {
  const shader = gl.createShader(shaderType);

  if (shader === null) {
    throw new Error(`Unable to create shader ${shaderName}`);
  }

  const shaderSource = require(`./shaders/${shaderName}.glsl`);
  gl.shaderSource(shader, shaderSource);

  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    gl.deleteShader(shader);
    throw new Error(
      `could not compile shader ${shaderName}: ${gl.getShaderInfoLog(shader)}`
    );
  }

  return shader;
}

function createShaderProgram(
  gl: WebGL2RenderingContext,
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
    throw new Error(`Program failed to link: ${gl.getProgramInfoLog(program)}`);
  }

  return program;
}

function setAttributeLocation(
  gl: WebGL2RenderingContext,
  shaderProgram: WebGLProgram,
  attributeLocation: AttributeLocations
): number {
  const name = AttributeLocations[attributeLocation];

  const location = gl.bindAttribLocation(
    shaderProgram,
    attributeLocation,
    name
  );

  if (location === null) {
    throw new Error(`Unable to find uniform ${name}`);
  }

  return attributeLocation;
}

function getUniformLocation(
  gl: WebGL2RenderingContext,
  shaderProgram: WebGLProgram,
  name: string
) {
  const location = gl.getUniformLocation(shaderProgram, name);

  if (location === null) {
    throw new Error(`Unable to find uniform ${name}`);
  }

  return location;
}
