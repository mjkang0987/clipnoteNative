import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/lib/theme";

export default function About() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>ClipNote란?</Text>
      <Text style={styles.paragraph}>
        ClipNote(클립노트)는 긴 URL을 공유하기 좋은 형태로 바꿔 주는 무료
        서비스예요. 링크를 붙여넣으면 페이지의 제목·설명·대표 이미지를 자동으로
        읽어와 카드 미리보기를 만들고, 카카오톡이나 SNS에 공유했을 때 보기 좋은
        이미지와 짧은 링크를 제공합니다. 네이버 카페 게시글, 인스타그램 릴처럼
        미리보기가 잘 안 잡히는 링크도 지원해요.
      </Text>

      <Text style={[styles.title, styles.mt24]}>이렇게 동작해요</Text>
      <Text style={styles.step}>1. 공유하고 싶은 URL을 붙여넣어요.</Text>
      <Text style={styles.step}>
        2. 제목·설명·대표 이미지를 자동으로 읽어와 카드를 만들어요.
      </Text>
      <Text style={styles.step}>
        3. 로그인하면 짧은 공유 링크가 생기고, 공유 시 예쁜 카드로 떠요.
      </Text>

      <View style={styles.branchBrand}>
        <Text style={styles.branchTitleBrand}>로그인 하면</Text>
        <Text style={styles.branchItem}>
          · <Text style={styles.boldBrand}>짧은 공유 링크</Text>를 만들어
          카카오톡·SNS에 보낼 수 있어요.
        </Text>
        <Text style={styles.branchItem}>· 공유한 링크가 예쁜 미리보기 카드로 떠요.</Text>
        <Text style={styles.branchItem}>
          · 클립이 계정에 쌓여 <Text style={styles.boldBrand}>다른 기기에서도</Text>{" "}
          그대로 보이고, 태그로 정리돼요.
        </Text>
      </View>

      <View style={styles.branchNeutral}>
        <Text style={styles.branchTitle}>로그인 안 해도</Text>
        <Text style={styles.branchItem}>
          · URL을 붙여넣어 미리보기 카드를 만들 수 있어요.
        </Text>
        <Text style={styles.branchItem}>
          · 만든 클립을 이 기기에 저장하고 ‘내 클립’에서 다시 봐요.
        </Text>
        <Text style={styles.branchItem}>
          · 단, 저장은 <Text style={styles.boldFg}>이 기기에만</Text> 남고{" "}
          <Text style={styles.boldFg}>짧은 공유 링크는 못 만들어요.</Text>
        </Text>
      </View>

      <Text style={[styles.title, styles.mt24]}>자주 묻는 질문</Text>
      <Text style={styles.qaQ}>태그는 어떻게 쓰나요?</Text>
      <Text style={styles.qaA}>
        태그 칸에 쉼표(,)로 최대 6개까지 달 수 있어요. ‘내 클립’에서 같은 태그끼리
        모아 볼 수 있어요.
      </Text>
      <Text style={styles.qaQ}>로그인 없이도 쓸 수 있나요?</Text>
      <Text style={styles.qaA}>
        네. 비로그인 상태에서도 URL을 이 기기에 저장할 수 있어요. 다만 공유 링크
        생성은 로그인(Google·Kakao)이 필요합니다.
      </Text>
      <Text style={styles.qaQ}>네이버 카페·인스타그램 링크도 되나요?</Text>
      <Text style={styles.qaA}>
        네. 전용 추출로 네이버 카페 게시글 제목, 인스타그램 릴·게시물 정보까지
        가져와요. (비공개·멤버 전용 글은 제한될 수 있어요.)
      </Text>
      <Text style={styles.qaQ}>무료인가요?</Text>
      <Text style={styles.qaA}>네, 무료로 사용할 수 있어요.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 18, fontWeight: "700", color: colors.fg },
  mt24: { marginTop: 24 },
  paragraph: { marginTop: 10, fontSize: 14, lineHeight: 22, color: colors.fgMuted },
  step: { marginTop: 6, fontSize: 14, lineHeight: 21, color: colors.fgMuted },

  branchBrand: {
    marginTop: 16,
    backgroundColor: colors.brandSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(124,92,252,0.35)",
    borderRadius: radius.md,
    padding: 14,
  },
  branchNeutral: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
  },
  branchTitleBrand: { fontSize: 14, fontWeight: "600", color: colors.brandStrong },
  branchTitle: { fontSize: 14, fontWeight: "600", color: colors.fg },
  branchItem: { marginTop: 6, fontSize: 14, lineHeight: 21, color: colors.fgMuted },
  boldBrand: { fontWeight: "600", color: colors.brandStrong },
  boldFg: { fontWeight: "600", color: colors.fg },

  qaQ: { marginTop: 14, fontSize: 14, fontWeight: "600", color: colors.fg },
  qaA: { marginTop: 4, fontSize: 14, lineHeight: 21, color: colors.fgMuted },
});
