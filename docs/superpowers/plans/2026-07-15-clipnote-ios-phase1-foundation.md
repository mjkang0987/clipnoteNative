# ClipNote iOS — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `clipnote-ios` Swift project with a validated build/test loop and the core, framework-independent logic (theme, models, networking, share-text helper) fully unit-tested.

**Architecture:** SwiftUI app scaffolded with XcodeGen (declarative `project.yml`, CLI-friendly). Phase 1 delivers pure-logic units — `Theme`, `Models`, `APIClient`, `ShareText` — that later UI phases consume. No auth SDK, no ads, no views yet (those are Phase 2+). Each logic unit is TDD'd with Swift Testing against a simulator.

**Tech Stack:** Swift 6.3 / Xcode 26, SwiftUI, XcodeGen, Swift Testing (`import Testing`), URLSession. Backend reused as-is (`https://clipnote.co.kr`).

## Global Constraints

- iOS deployment target: **17.0** (SwiftData required in later phases; set now).
- Bundle ID: `kr.co.clipnote.app`.
- URL scheme: `clipnote`.
- Backend base URL default: `https://clipnote.co.kr` (overridable via `API_BASE` Info.plist key).
- `pickGradient` MUST replicate the JS hash exactly: `hash = (hash * 31 + codeUnit) | 0` over **UTF-16 code units**, then `abs(hash) % 8`. Ground-truth pairs (from original JS) are in Task 2.
- Gradient order is fixed: `sunset, ocean, grape, forest, peach, midnight, mint, rose`.
- Test destination: `platform=iOS Simulator,name=iPhone 17`.
- Repo: `git@github.com:mjkang0987/clipnote-ios.git`, cloned to `/Users/n230418003/Desktop/git/clipnote-ios`.
- Swift Testing, not XCTest. Frequent commits (one per task minimum).

---

## File Structure

```
clipnote-ios/
├── project.yml                       # XcodeGen project definition
├── .gitignore
├── Secrets.example.xcconfig           # committed template
├── Secrets.xcconfig                   # gitignored (real values)
├── ClipNote/
│   ├── App/ClipNoteApp.swift          # @main entry, placeholder root view
│   ├── Theme/Theme.swift              # AppColor, Radius, Gradient, pickGradient
│   ├── Models/Models.swift            # Codable DTOs + UClip
│   ├── Networking/APIClient.swift     # URLSession REST client
│   └── Util/ShareText.swift           # buildShareText(title:description:url:)
└── ClipNoteTests/
    ├── ThemeTests.swift
    ├── ModelsTests.swift
    ├── ShareTextTests.swift
    └── APIClientTests.swift
```

---

## Task 1: Project scaffold — buildable empty app

**Files:**
- Create: `/Users/n230418003/Desktop/git/clipnote-ios/project.yml`
- Create: `/Users/n230418003/Desktop/git/clipnote-ios/.gitignore`
- Create: `/Users/n230418003/Desktop/git/clipnote-ios/Secrets.example.xcconfig`
- Create: `/Users/n230418003/Desktop/git/clipnote-ios/Secrets.xcconfig`
- Create: `/Users/n230418003/Desktop/git/clipnote-ios/ClipNote/App/ClipNoteApp.swift`
- Create: `/Users/n230418003/Desktop/git/clipnote-ios/ClipNoteTests/ThemeTests.swift` (temporary smoke test)

**Interfaces:**
- Consumes: nothing.
- Produces: an Xcode project named `ClipNote` with a `ClipNote` app target and a `ClipNoteTests` unit-test target, buildable and testable from CLI.

- [ ] **Step 1: Install XcodeGen**

Run: `brew install xcodegen`
Expected: `xcodegen` on PATH. Verify: `xcodegen --version` prints a version.

- [ ] **Step 2: Clone the empty repo**

Run:
```bash
cd /Users/n230418003/Desktop/git
git clone git@github.com:mjkang0987/clipnote-ios.git
cd clipnote-ios
```
Expected: empty repo cloned (warning about empty repository is fine).

- [ ] **Step 3: Write `.gitignore`**

Create `/Users/n230418003/Desktop/git/clipnote-ios/.gitignore`:
```gitignore
# Xcode
*.xcodeproj
xcuserdata/
DerivedData/
build/
*.xcworkspace
!default.xcworkspace

# Secrets
Secrets.xcconfig

# macOS
.DS_Store

# SwiftPM
.swiftpm/
```
Note: `*.xcodeproj` is ignored because XcodeGen regenerates it from `project.yml`.

- [ ] **Step 4: Write secrets template and local secrets**

Create `/Users/n230418003/Desktop/git/clipnote-ios/Secrets.example.xcconfig`:
```
// Copy to Secrets.xcconfig and fill in. Secrets.xcconfig is gitignored.
API_BASE = https:/$()/clipnote.co.kr
SUPABASE_URL =
SUPABASE_ANON_KEY =
NAVER_CLIENT_ID =
ADMOB_APP_ID =
ADMOB_BANNER_UNIT_ID =
```
Note: `https:/$()/` is the xcconfig-safe way to write `//` (xcconfig treats `//` as a comment). At build time it resolves to `https://clipnote.co.kr`.

Create `/Users/n230418003/Desktop/git/clipnote-ios/Secrets.xcconfig` with the same keys; fill `API_BASE` now, leave the rest blank until Phase 2:
```
API_BASE = https:/$()/clipnote.co.kr
SUPABASE_URL =
SUPABASE_ANON_KEY =
NAVER_CLIENT_ID =
ADMOB_APP_ID =
ADMOB_BANNER_UNIT_ID =
```

- [ ] **Step 5: Write `project.yml`**

Create `/Users/n230418003/Desktop/git/clipnote-ios/project.yml`:
```yaml
name: ClipNote
options:
  bundleIdPrefix: kr.co.clipnote
  deploymentTarget:
    iOS: "17.0"
  createIntermediateGroups: true
configs:
  Debug: debug
  Release: release
settings:
  base:
    SWIFT_VERSION: "6.0"
    MARKETING_VERSION: "1.0.0"
    CURRENT_PROJECT_VERSION: "1"
targets:
  ClipNote:
    type: application
    platform: iOS
    configFiles:
      Debug: Secrets.xcconfig
      Release: Secrets.xcconfig
    sources:
      - ClipNote
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: kr.co.clipnote.app
        GENERATE_INFOPLIST_FILE: true
        INFOPLIST_KEY_UILaunchScreen_Generation: true
        INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents: true
        INFOPLIST_KEY_UISupportedInterfaceOrientations: UIInterfaceOrientationPortrait
        API_BASE: $(API_BASE)
      configs:
        Debug:
          INFOPLIST_KEY_API_BASE: $(API_BASE)
        Release:
          INFOPLIST_KEY_API_BASE: $(API_BASE)
  ClipNoteTests:
    type: bundle.unit-test
    platform: iOS
    sources:
      - ClipNoteTests
    dependencies:
      - target: ClipNote
    settings:
      base:
        GENERATE_INFOPLIST_FILE: true
schemes:
  ClipNote:
    build:
      targets:
        ClipNote: all
    test:
      targets:
        - ClipNoteTests
```
Note: `INFOPLIST_KEY_API_BASE` injects the `API_BASE` build setting into the generated Info.plist under key `API_BASE`, readable at runtime via `Bundle.main.object(forInfoDictionaryKey:)`.

- [ ] **Step 6: Write the app entry point**

Create `/Users/n230418003/Desktop/git/clipnote-ios/ClipNote/App/ClipNoteApp.swift`:
```swift
import SwiftUI

@main
struct ClipNoteApp: App {
    var body: some Scene {
        WindowGroup {
            RootPlaceholderView()
        }
    }
}

struct RootPlaceholderView: View {
    var body: some View {
        VStack(spacing: 12) {
            Text("ClipNote")
                .font(.largeTitle.bold())
            Text("Foundation online")
                .foregroundStyle(.secondary)
        }
    }
}
```

- [ ] **Step 7: Write a temporary smoke test**

Create `/Users/n230418003/Desktop/git/clipnote-ios/ClipNoteTests/ThemeTests.swift`:
```swift
import Testing

@Test func scaffoldSmoke() {
    #expect(1 + 1 == 2)
}
```
(This file is fully replaced in Task 2.)

- [ ] **Step 8: Generate the Xcode project**

Run:
```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
xcodegen generate
```
Expected: `Created project at ClipNote.xcodeproj`.

- [ ] **Step 9: Build for the simulator**

Run:
```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
xcodebuild build -project ClipNote.xcodeproj -scheme ClipNote \
  -destination 'platform=iOS Simulator,name=iPhone 17' | tail -5
```
Expected: `** BUILD SUCCEEDED **`.

- [ ] **Step 10: Run the smoke test**

Run:
```bash
xcodebuild test -project ClipNote.xcodeproj -scheme ClipNote \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -only-testing:ClipNoteTests/scaffoldSmoke | tail -8
```
Expected: `** TEST SUCCEEDED **`.

- [ ] **Step 11: Commit**

```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
git add -A
git commit -m "chore: XcodeGen 스캐폴드 + 빈 앱 빌드/테스트 통과"
git push -u origin main
```

---

## Task 2: Theme + pickGradient

**Files:**
- Create: `/Users/n230418003/Desktop/git/clipnote-ios/ClipNote/Theme/Theme.swift`
- Modify (replace): `/Users/n230418003/Desktop/git/clipnote-ios/ClipNoteTests/ThemeTests.swift`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `enum AppColor` with `static let` SwiftUI `Color`s: `brand`, `brandStrong`, `brandSoft`, `bg`, `surface`, `border`, `fg`, `fgMuted`, `success`, `danger`, `warning`, `white`.
  - `enum Radius { static let sm: CGFloat = 8; md = 12; lg = 16; full = 9999 }`.
  - `struct Gradient: Equatable { let name: String; let from: Color; let to: Color }`.
  - `let GRADIENTS: [Gradient]` (8 entries, fixed order).
  - `func pickGradient(_ seed: String) -> Gradient`.

- [ ] **Step 1: Write the failing tests**

Replace `/Users/n230418003/Desktop/git/clipnote-ios/ClipNoteTests/ThemeTests.swift` with:
```swift
import Testing
@testable import ClipNote

@Suite struct ThemeTests {
    // Ground truth generated from the original JS pickGradient.
    @Test(arguments: [
        ("clipnote", "grape"),
        ("", "sunset"),
        ("a", "ocean"),
        ("hello world", "peach"),
        ("네이버", "peach"),
        ("https://example.com/article", "midnight"),
        ("ClipNote", "grape"),
        ("z", "grape"),
    ])
    func pickGradientMatchesJS(seed: String, expected: String) {
        #expect(pickGradient(seed).name == expected)
    }

    @Test func gradientOrderIsFixed() {
        #expect(GRADIENTS.map(\.name) == [
            "sunset", "ocean", "grape", "forest",
            "peach", "midnight", "mint", "rose",
        ])
    }

    @Test func pickGradientIsDeterministic() {
        #expect(pickGradient("stable").name == pickGradient("stable").name)
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
xcodebuild test -project ClipNote.xcodeproj -scheme ClipNote \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -only-testing:ClipNoteTests/ThemeTests 2>&1 | tail -15
```
Expected: compile failure (`cannot find 'pickGradient' in scope`).

- [ ] **Step 3: Write the implementation**

Create `/Users/n230418003/Desktop/git/clipnote-ios/ClipNote/Theme/Theme.swift`:
```swift
import SwiftUI

enum AppColor {
    static let brand = Color(hex: 0x7C5CFC)
    static let brandStrong = Color(hex: 0x5B3FE0)
    static let brandSoft = Color(hex: 0xEFEBFF)
    static let bg = Color(hex: 0xFFFFFF)
    static let surface = Color(hex: 0xF7F7F9)
    static let border = Color(hex: 0xE4E4E7)
    static let fg = Color(hex: 0x18181B)
    static let fgMuted = Color(hex: 0x71717A)
    static let success = Color(hex: 0x16A34A)
    static let danger = Color(hex: 0xDC2626)
    static let warning = Color(hex: 0xD97706)
    static let white = Color(hex: 0xFFFFFF)
}

enum Radius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let full: CGFloat = 9999
}

struct Gradient: Equatable {
    let name: String
    let from: Color
    let to: Color
}

let GRADIENTS: [Gradient] = [
    Gradient(name: "sunset", from: Color(hex: 0xFF6B6B), to: Color(hex: 0xFFA94D)),
    Gradient(name: "ocean", from: Color(hex: 0x4F8DFD), to: Color(hex: 0x6FE0C9)),
    Gradient(name: "grape", from: Color(hex: 0x7C5CFC), to: Color(hex: 0xE879F9)),
    Gradient(name: "forest", from: Color(hex: 0x0EA5E9), to: Color(hex: 0x22C55E)),
    Gradient(name: "peach", from: Color(hex: 0xFB7185), to: Color(hex: 0xFDBA74)),
    Gradient(name: "midnight", from: Color(hex: 0x4338CA), to: Color(hex: 0x7C3AED)),
    Gradient(name: "mint", from: Color(hex: 0x06B6D4), to: Color(hex: 0x34D399)),
    Gradient(name: "rose", from: Color(hex: 0xEC4899), to: Color(hex: 0x8B5CF6)),
]

/// Deterministic gradient selection. Replicates the JS hash exactly:
/// `hash = (hash * 31 + codeUnit) | 0` over UTF-16 code units, then `abs(hash) % 8`.
func pickGradient(_ seed: String) -> Gradient {
    var hash: Int32 = 0
    for unit in seed.utf16 {
        hash = hash &* 31 &+ Int32(unit)
    }
    let idx = Int(abs(Int(hash))) % GRADIENTS.count
    return GRADIENTS[idx]
}

extension Color {
    init(hex: UInt32) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: 1)
    }
}
```
Note on the hash: `&*` and `&+` are Swift's overflow-wrapping operators on `Int32`, which reproduce JS's `| 0` 32-bit signed wraparound. `abs(Int(hash))` widens to 64-bit before `abs` so `Int32.min` cannot trap.

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
xcodebuild test -project ClipNote.xcodeproj -scheme ClipNote \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -only-testing:ClipNoteTests/ThemeTests 2>&1 | tail -10
```
Expected: `** TEST SUCCEEDED **` (all ThemeTests pass).

- [ ] **Step 5: Commit**

```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
git add -A
git commit -m "feat: 테마 토큰 + pickGradient(JS 해시 동일) 이식"
git push
```

---

## Task 3: Models (Codable DTOs)

**Files:**
- Create: `/Users/n230418003/Desktop/git/clipnote-ios/ClipNote/Models/Models.swift`
- Create: `/Users/n230418003/Desktop/git/clipnote-ios/ClipNoteTests/ModelsTests.swift`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `struct ClipMetadata: Codable, Equatable { let url: String; let title: String?; let description: String?; let image: String?; let siteName: String?; let source: String; let reason: String? }`
  - `struct DbClip: Codable, Equatable, Identifiable { let slug, url, title: String; let description, image, siteName: String?; let gradient: String; let tags: [String]; let saved, shared: Bool; let createdAt: String; var id: String { slug } }`
  - `struct CreateClipInput: Codable { let url, title: String; var description, image, siteName: String?; var tags: [String]?; var gradient: String; var save: Bool? }`
  - `struct CreateClipResult: Codable { let slug, shareUrl: String?; let alreadySaved: Bool?; let error: String? }`
  - `struct UClip: Identifiable, Equatable { let id: String; let slug: String?; let url, title: String; let description, image, siteName: String?; let gradient: String; let tags: [String]; let shared, local: Bool }`

- [ ] **Step 1: Write the failing tests**

Create `/Users/n230418003/Desktop/git/clipnote-ios/ClipNoteTests/ModelsTests.swift`:
```swift
import Testing
import Foundation
@testable import ClipNote

@Suite struct ModelsTests {
    @Test func decodesDbClipFromServerJSON() throws {
        let json = """
        {
          "slug": "abc123",
          "url": "https://example.com/a",
          "title": "제목",
          "description": "설명",
          "image": null,
          "siteName": "Example",
          "gradient": "grape",
          "tags": ["개발", "디자인"],
          "saved": true,
          "shared": false,
          "createdAt": "2026-01-02T03:04:05Z"
        }
        """.data(using: .utf8)!
        let clip = try JSONDecoder().decode(DbClip.self, from: json)
        #expect(clip.slug == "abc123")
        #expect(clip.tags == ["개발", "디자인"])
        #expect(clip.saved == true)
        #expect(clip.shared == false)
        #expect(clip.image == nil)
        #expect(clip.id == "abc123")
    }

    @Test func decodesMetadataWithNulls() throws {
        let json = """
        {"url":"https://x.com","title":null,"description":null,
         "image":null,"siteName":null,"source":"none","reason":"no og"}
        """.data(using: .utf8)!
        let meta = try JSONDecoder().decode(ClipMetadata.self, from: json)
        #expect(meta.title == nil)
        #expect(meta.source == "none")
        #expect(meta.reason == "no og")
    }

    @Test func encodesCreateClipInputOmittingNilSave() throws {
        let input = CreateClipInput(
            url: "https://x.com", title: "T",
            description: nil, image: nil, siteName: nil,
            tags: ["a"], gradient: "ocean", save: nil
        )
        let data = try JSONEncoder().encode(input)
        let obj = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        #expect(obj["url"] as? String == "https://x.com")
        #expect(obj["gradient"] as? String == "ocean")
        #expect(obj["save"] == nil) // nil save must not be sent
    }

    @Test func decodesCreateClipResult() throws {
        let json = #"{"slug":"s1","shareUrl":"https://clipnote.co.kr/s1"}"#.data(using: .utf8)!
        let res = try JSONDecoder().decode(CreateClipResult.self, from: json)
        #expect(res.shareUrl == "https://clipnote.co.kr/s1")
        #expect(res.error == nil)
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
xcodebuild test -project ClipNote.xcodeproj -scheme ClipNote \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -only-testing:ClipNoteTests/ModelsTests 2>&1 | tail -15
```
Expected: compile failure (`cannot find type 'DbClip' in scope`).

- [ ] **Step 3: Write the implementation**

Create `/Users/n230418003/Desktop/git/clipnote-ios/ClipNote/Models/Models.swift`:
```swift
import Foundation

struct ClipMetadata: Codable, Equatable {
    let url: String
    let title: String?
    let description: String?
    let image: String?
    let siteName: String?
    let source: String
    let reason: String?
}

struct DbClip: Codable, Equatable, Identifiable {
    let slug: String
    let url: String
    let title: String
    let description: String?
    let image: String?
    let siteName: String?
    let gradient: String
    let tags: [String]
    let saved: Bool
    let shared: Bool
    let createdAt: String
    var id: String { slug }
}

struct CreateClipInput: Codable {
    let url: String
    let title: String
    var description: String?
    var image: String?
    var siteName: String?
    var tags: [String]?
    var gradient: String
    var save: Bool?
}

struct CreateClipResult: Codable {
    let slug: String?
    let shareUrl: String?
    let alreadySaved: Bool?
    let error: String?
}

/// Unified view model over local (AsyncStorage-equivalent) and DB clips.
/// `id` = slug for DB clips, url for local clips.
struct UClip: Identifiable, Equatable {
    let id: String
    let slug: String?
    let url: String
    let title: String
    let description: String?
    let image: String?
    let siteName: String?
    let gradient: String
    let tags: [String]
    let shared: Bool
    let local: Bool
}
```
Note: `CreateClipInput`'s optional `var` fields with `nil` values are omitted by the default `JSONEncoder` for a `struct` only when the synthesized `encode(to:)` skips nils — Swift's synthesized encoder DOES emit `null` for nil optionals by default. To satisfy `save` omission, verify Step 4; if `save: null` is emitted, replace the synthesized conformance with an explicit `encode(to:)` that uses `encodeIfPresent` for every optional. (Server treats absent and false differently only for `save`, so `encodeIfPresent` is the correct behavior for all optionals.)

- [ ] **Step 4: Run tests; if `encodesCreateClipInputOmittingNilSave` fails, add explicit encoder**

Run:
```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
xcodebuild test -project ClipNote.xcodeproj -scheme ClipNote \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -only-testing:ClipNoteTests/ModelsTests 2>&1 | tail -12
```
If `encodesCreateClipInputOmittingNilSave` fails (synthesized encoder emitted `save: null`), add this to `CreateClipInput` in `Models.swift`:
```swift
    enum CodingKeys: String, CodingKey {
        case url, title, description, image, siteName, tags, gradient, save
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(url, forKey: .url)
        try c.encode(title, forKey: .title)
        try c.encodeIfPresent(description, forKey: .description)
        try c.encodeIfPresent(image, forKey: .image)
        try c.encodeIfPresent(siteName, forKey: .siteName)
        try c.encodeIfPresent(tags, forKey: .tags)
        try c.encode(gradient, forKey: .gradient)
        try c.encodeIfPresent(save, forKey: .save)
    }
```
Then re-run the command above.
Expected: `** TEST SUCCEEDED **`.

- [ ] **Step 5: Commit**

```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
git add -A
git commit -m "feat: 클립 모델(Codable DTO + UClip) 이식"
git push
```

---

## Task 4: ShareText helper (§4.3 신규 요구사항)

**Files:**
- Create: `/Users/n230418003/Desktop/git/clipnote-ios/ClipNote/Util/ShareText.swift`
- Create: `/Users/n230418003/Desktop/git/clipnote-ios/ClipNoteTests/ShareTextTests.swift`

**Interfaces:**
- Consumes: nothing.
- Produces: `func buildShareText(title: String, description: String?, url: String) -> String` — joins title, description (only when non-empty), and url with `\n`.

- [ ] **Step 1: Write the failing tests**

Create `/Users/n230418003/Desktop/git/clipnote-ios/ClipNoteTests/ShareTextTests.swift`:
```swift
import Testing
@testable import ClipNote

@Suite struct ShareTextTests {
    @Test func joinsTitleDescriptionURLWithNewlines() {
        let text = buildShareText(
            title: "좋은 글",
            description: "요약입니다",
            url: "https://clipnote.co.kr/abc"
        )
        #expect(text == "좋은 글\n요약입니다\nhttps://clipnote.co.kr/abc")
    }

    @Test func omitsDescriptionLineWhenNil() {
        let text = buildShareText(
            title: "제목만",
            description: nil,
            url: "https://clipnote.co.kr/xyz"
        )
        #expect(text == "제목만\nhttps://clipnote.co.kr/xyz")
    }

    @Test func omitsDescriptionLineWhenBlank() {
        let text = buildShareText(
            title: "제목",
            description: "   ",
            url: "https://clipnote.co.kr/xyz"
        )
        #expect(text == "제목\nhttps://clipnote.co.kr/xyz")
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
xcodebuild test -project ClipNote.xcodeproj -scheme ClipNote \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -only-testing:ClipNoteTests/ShareTextTests 2>&1 | tail -12
```
Expected: compile failure (`cannot find 'buildShareText' in scope`).

- [ ] **Step 3: Write the implementation**

Create `/Users/n230418003/Desktop/git/clipnote-ios/ClipNote/Util/ShareText.swift`:
```swift
import Foundation

/// Builds the clipboard/share payload for a clip's share link.
/// Format: title, then description (only if non-blank), then url — newline-joined.
func buildShareText(title: String, description: String?, url: String) -> String {
    var lines = [title]
    if let d = description?.trimmingCharacters(in: .whitespacesAndNewlines), !d.isEmpty {
        lines.append(d)
    }
    lines.append(url)
    return lines.joined(separator: "\n")
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
xcodebuild test -project ClipNote.xcodeproj -scheme ClipNote \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -only-testing:ClipNoteTests/ShareTextTests 2>&1 | tail -10
```
Expected: `** TEST SUCCEEDED **`.

- [ ] **Step 5: Commit**

```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
git add -A
git commit -m "feat: 공유 텍스트 빌더(제목+설명+링크 개행 결합)"
git push
```

---

## Task 5: APIClient

**Files:**
- Create: `/Users/n230418003/Desktop/git/clipnote-ios/ClipNote/Networking/APIClient.swift`
- Create: `/Users/n230418003/Desktop/git/clipnote-ios/ClipNoteTests/APIClientTests.swift`

**Interfaces:**
- Consumes: `ClipMetadata`, `DbClip`, `CreateClipInput`, `CreateClipResult` (Task 3).
- Produces `actor APIClient`:
  - `init(baseURL: URL, session: URLSession = .shared)`
  - `static let shared: APIClient` (reads `API_BASE` from Info.plist, default `https://clipnote.co.kr`)
  - `func fetchMetadata(url: String) async throws -> ClipMetadata`
  - `func createClip(_ input: CreateClipInput, accessToken: String?) async -> CreateClipResult`
  - `func ogImageURL(title: String, description: String?, siteName: String?, gradient: String) -> URL`
  - `func getClips(accessToken: String?) async -> (loggedIn: Bool, clips: [DbClip])`
  - `func updateClip(slug: String, title: String?, tags: [String]?, shared: Bool?, accessToken: String?) async -> Bool`
  - `func deleteClip(slug: String, accessToken: String?) async -> Bool`
  - `struct ClipsResponse: Codable { let loggedIn: Bool; let clips: [DbClip] }`

- [ ] **Step 1: Write the failing tests**

Create `/Users/n230418003/Desktop/git/clipnote-ios/ClipNoteTests/APIClientTests.swift`:
```swift
import Testing
import Foundation
@testable import ClipNote

/// URLProtocol stub that returns queued (status, body) per request and records requests.
final class StubURLProtocol: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var handler: ((URLRequest) -> (Int, Data))?
    nonisolated(unsafe) static var lastRequest: URLRequest?
    nonisolated(unsafe) static var lastBody: Data?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        StubURLProtocol.lastRequest = request
        StubURLProtocol.lastBody = request.httpBody
            ?? request.httpBodyStream.map { s -> Data in
                s.open(); defer { s.close() }
                var data = Data(); var buf = [UInt8](repeating: 0, count: 4096)
                while s.hasBytesAvailable { let n = s.read(&buf, maxLength: buf.count); if n <= 0 { break }; data.append(buf, count: n) }
                return data
            }
        let (status, body) = StubURLProtocol.handler?(request) ?? (500, Data())
        let resp = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: nil)!
        client?.urlProtocol(self, didReceive: resp, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: body)
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}

private func stubbedClient() -> APIClient {
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [StubURLProtocol.self]
    return APIClient(baseURL: URL(string: "https://clipnote.co.kr")!,
                     session: URLSession(configuration: config))
}

@Suite struct APIClientTests {
    @Test func fetchMetadataParsesResponse() async throws {
        StubURLProtocol.handler = { _ in
            (200, #"{"url":"https://x.com","title":"T","description":"D","image":null,"siteName":"X","source":"og"}"#.data(using: .utf8)!)
        }
        let meta = try await stubbedClient().fetchMetadata(url: "https://x.com")
        #expect(meta.title == "T")
        #expect(meta.source == "og")
        #expect(StubURLProtocol.lastRequest?.url?.absoluteString.contains("/api/metadata?url=") == true)
    }

    @Test func createClipSendsBearerAndBody() async {
        StubURLProtocol.handler = { _ in
            (200, #"{"slug":"s1","shareUrl":"https://clipnote.co.kr/s1"}"#.data(using: .utf8)!)
        }
        let input = CreateClipInput(url: "https://x.com", title: "T",
            description: nil, image: nil, siteName: nil,
            tags: ["a"], gradient: "ocean", save: true)
        let res = await stubbedClient().createClip(input, accessToken: "tok123")
        #expect(res.shareUrl == "https://clipnote.co.kr/s1")
        #expect(StubURLProtocol.lastRequest?.value(forHTTPHeaderField: "Authorization") == "Bearer tok123")
        let body = try! JSONSerialization.jsonObject(with: StubURLProtocol.lastBody ?? Data()) as! [String: Any]
        #expect(body["save"] as? Bool == true)
    }

    @Test func createClipReturnsErrorOnNon2xx() async {
        StubURLProtocol.handler = { _ in (401, #"{"error":"unauthorized"}"#.data(using: .utf8)!) }
        let input = CreateClipInput(url: "https://x.com", title: "T",
            description: nil, image: nil, siteName: nil, tags: nil, gradient: "ocean", save: nil)
        let res = await stubbedClient().createClip(input, accessToken: nil)
        #expect(res.error == "unauthorized")
    }

    @Test func getClipsFallsBackToEmptyOnFailure() async {
        StubURLProtocol.handler = { _ in (500, Data()) }
        let out = await stubbedClient().getClips(accessToken: "t")
        #expect(out.loggedIn == false)
        #expect(out.clips.isEmpty)
    }

    @Test func ogImageURLBuildsQuery() async {
        let url = await stubbedClient().ogImageURL(title: "제목 A", description: "설명",
            siteName: "Site", gradient: "grape")
        let s = url.absoluteString
        #expect(s.contains("/api/og?"))
        #expect(s.contains("g=grape"))
        #expect(s.contains("title=")) // percent-encoded
    }

    @Test func updateClipReturnsTrueOn2xx() async {
        StubURLProtocol.handler = { _ in (200, Data()) }
        let ok = await stubbedClient().updateClip(slug: "s1", title: "new",
            tags: ["x"], shared: nil, accessToken: "t")
        #expect(ok == true)
        #expect(StubURLProtocol.lastRequest?.httpMethod == "PATCH")
    }

    @Test func deleteClipUsesDeleteMethod() async {
        StubURLProtocol.handler = { _ in (200, Data()) }
        let ok = await stubbedClient().deleteClip(slug: "s1", accessToken: "t")
        #expect(ok == true)
        #expect(StubURLProtocol.lastRequest?.httpMethod == "DELETE")
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
xcodebuild test -project ClipNote.xcodeproj -scheme ClipNote \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -only-testing:ClipNoteTests/APIClientTests 2>&1 | tail -15
```
Expected: compile failure (`cannot find 'APIClient' in scope`).

- [ ] **Step 3: Write the implementation**

Create `/Users/n230418003/Desktop/git/clipnote-ios/ClipNote/Networking/APIClient.swift`:
```swift
import Foundation

actor APIClient {
    private let baseURL: URL
    private let session: URLSession

    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    static let shared: APIClient = {
        let raw = Bundle.main.object(forInfoDictionaryKey: "API_BASE") as? String
        let base = URL(string: (raw?.isEmpty == false ? raw! : "https://clipnote.co.kr"))!
        return APIClient(baseURL: base)
    }()

    struct ClipsResponse: Codable {
        let loggedIn: Bool
        let clips: [DbClip]
    }

    // GET /api/metadata?url=...
    func fetchMetadata(url: String) async throws -> ClipMetadata {
        var comps = URLComponents(url: baseURL.appendingPathComponent("api/metadata"),
                                  resolvingAgainstBaseURL: false)!
        comps.queryItems = [URLQueryItem(name: "url", value: url)]
        let (data, resp) = try await session.data(from: comps.url!)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(ClipMetadata.self, from: data)
    }

    // POST /api/clip
    func createClip(_ input: CreateClipInput, accessToken: String?) async -> CreateClipResult {
        var req = URLRequest(url: baseURL.appendingPathComponent("api/clip"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let t = accessToken { req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization") }
        req.httpBody = try? JSONEncoder().encode(input)
        do {
            let (data, resp) = try await session.data(for: req)
            let http = resp as? HTTPURLResponse
            let decoded = try? JSONDecoder().decode(CreateClipResult.self, from: data)
            if let http, !(200..<300).contains(http.statusCode) {
                return CreateClipResult(slug: nil, shareUrl: nil, alreadySaved: nil,
                                        error: decoded?.error ?? "clip \(http.statusCode)")
            }
            return decoded ?? CreateClipResult(slug: nil, shareUrl: nil, alreadySaved: nil, error: "parse")
        } catch {
            return CreateClipResult(slug: nil, shareUrl: nil, alreadySaved: nil, error: "network")
        }
    }

    // GET /api/og?title=...&g=...&desc=...&site=...
    func ogImageURL(title: String, description: String?, siteName: String?, gradient: String) -> URL {
        var comps = URLComponents(url: baseURL.appendingPathComponent("api/og"),
                                  resolvingAgainstBaseURL: false)!
        var items = [URLQueryItem(name: "title", value: title),
                     URLQueryItem(name: "g", value: gradient)]
        if let d = description, !d.isEmpty { items.append(URLQueryItem(name: "desc", value: d)) }
        if let s = siteName, !s.isEmpty { items.append(URLQueryItem(name: "site", value: s)) }
        comps.queryItems = items
        return comps.url!
    }

    // GET /api/clips
    func getClips(accessToken: String?) async -> (loggedIn: Bool, clips: [DbClip]) {
        var req = URLRequest(url: baseURL.appendingPathComponent("api/clips"))
        if let t = accessToken { req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization") }
        do {
            let (data, resp) = try await session.data(for: req)
            guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                return (false, [])
            }
            let decoded = try JSONDecoder().decode(ClipsResponse.self, from: data)
            return (decoded.loggedIn, decoded.clips)
        } catch {
            return (false, [])
        }
    }

    // PATCH /api/clip/{slug}
    func updateClip(slug: String, title: String?, tags: [String]?, shared: Bool?,
                    accessToken: String?) async -> Bool {
        var req = URLRequest(url: baseURL.appendingPathComponent("api/clip/\(slug)"))
        req.httpMethod = "PATCH"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let t = accessToken { req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization") }
        var patch: [String: Any] = [:]
        if let title { patch["title"] = title }
        if let tags { patch["tags"] = tags }
        if let shared { patch["shared"] = shared }
        req.httpBody = try? JSONSerialization.data(withJSONObject: patch)
        return await is2xx(req)
    }

    // DELETE /api/clip/{slug}
    func deleteClip(slug: String, accessToken: String?) async -> Bool {
        var req = URLRequest(url: baseURL.appendingPathComponent("api/clip/\(slug)"))
        req.httpMethod = "DELETE"
        if let t = accessToken { req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization") }
        return await is2xx(req)
    }

    private func is2xx(_ req: URLRequest) async -> Bool {
        do {
            let (_, resp) = try await session.data(for: req)
            guard let http = resp as? HTTPURLResponse else { return false }
            return (200..<300).contains(http.statusCode)
        } catch {
            return false
        }
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
xcodebuild test -project ClipNote.xcodeproj -scheme ClipNote \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -only-testing:ClipNoteTests/APIClientTests 2>&1 | tail -12
```
Expected: `** TEST SUCCEEDED **`.

- [ ] **Step 5: Run the full test suite**

Run:
```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
xcodebuild test -project ClipNote.xcodeproj -scheme ClipNote \
  -destination 'platform=iOS Simulator,name=iPhone 17' 2>&1 | tail -12
```
Expected: `** TEST SUCCEEDED **` (ThemeTests + ModelsTests + ShareTextTests + APIClientTests).

- [ ] **Step 6: Commit**

```bash
cd /Users/n230418003/Desktop/git/clipnote-ios
git add -A
git commit -m "feat: APIClient(메타·클립·OG·목록·수정·삭제) 이식 + URLProtocol 테스트"
git push
```

---

## Phase 1 완료 기준

- `clipnote-ios` 레포에 XcodeGen 프로젝트, 시뮬레이터 빌드/테스트 통과.
- `Theme`(pickGradient JS 동일), `Models`(Codable), `ShareText`(§4.3), `APIClient` 유닛 테스트 그린.
- 커밋 5개 push 완료.

## 다음 페이즈 (각각 별도 계획)

- **Phase 2 — Auth:** SPM에 `supabase-swift` 추가, `AuthStore`, Google/Kakao/네이버 로그인, `.onOpenURL` 딥링크. (실기기/시뮬 수동 검증 포함)
- **Phase 3 — Local + Home:** SwiftData `LocalClipStore`, 마이그레이션, HomeView(디바운스 메타·미리보기·저장).
- **Phase 4 — Clips:** ClipsView(목록·필터·스와이프·다중선택·공유복사 §4.3), Edit/TagApply/ShareResult 모달.
- **Phase 5 — 나머지:** Login/Onboarding/About/FAQ/AccountDelete UI, AdMob 배너, 심사 대비(개인정보 매니페스트).

## Self-Review 결과

- **스펙 커버리지(Phase 1 범위):** Theme §3.5 ✓, Models §3.2 ✓, APIClient §3.1 ✓, ShareText §4.3 ✓, 스캐폴드/설정 §2 ✓. 인증·로컬·뷰·광고는 Phase 2+로 명시 이월.
- **플레이스홀더 스캔:** 없음. 모든 코드/명령/기대출력 구체화.
- **타입 일관성:** `CreateClipInput`/`CreateClipResult`/`DbClip`/`ClipMetadata` 시그니처가 Task 3 정의와 Task 5 사용처 일치. `ClipsResponse`는 APIClient 내부 정의.
