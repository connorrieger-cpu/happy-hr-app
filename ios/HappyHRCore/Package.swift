// swift-tools-version: 6.0
// HappyHRCore: the Happy HR app's models, deal logic, search and API client,
// ported from the web app's src/lib and checked against ../../shared/fixtures.
// No UI here, so it builds and tests on macOS, iOS and Linux alike.
import PackageDescription

let package = Package(
    name: "HappyHRCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "HappyHRCore", targets: ["HappyHRCore"]),
    ],
    targets: [
        .target(name: "HappyHRCore"),
        .testTarget(name: "HappyHRCoreTests", dependencies: ["HappyHRCore"]),
    ]
)
