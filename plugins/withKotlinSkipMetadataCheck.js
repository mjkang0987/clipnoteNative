const { withProjectBuildGradle } = require("@expo/config-plugins");

// AdMob SDK(play-services-ads)는 Kotlin 2.3.0으로 컴파일됐지만
// RN 0.85 툴체인은 Kotlin 컴파일러 2.1.0에 고정돼 메타데이터를 못 읽음.
// 모든 모듈의 Kotlin 컴파일에 -Xskip-metadata-version-check 를 붙여
// 상위 버전 메타데이터를 무시하고 컴파일하도록 함.
module.exports = function withKotlinSkipMetadataCheck(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      throw new Error(
        "withKotlinSkipMetadataCheck: root build.gradle 이 groovy 가 아님",
      );
    }
    const marker = "Xskip-metadata-version-check";
    if (cfg.modResults.contents.includes(marker)) return cfg;

    cfg.modResults.contents += `
allprojects {
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        compilerOptions {
            freeCompilerArgs.add("-Xskip-metadata-version-check")
        }
    }
}
`;
    return cfg;
  });
};
