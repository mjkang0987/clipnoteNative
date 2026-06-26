import { ScrollView, StyleSheet, Text, View } from "react-native";
import BrandLogo from "@/components/BrandLogo";
import { colors, radius } from "@/lib/theme";

export default function About() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.brand}>
        <BrandLogo size={24} />
      </View>
      <Text style={styles.title}>ClipNote란?</Text>
      <Text style={styles.paragraph}>
        ClipNote(클립노트)는 밋밋하고 긴 링크를 클릭하고 싶어지는 공유 카드로 바꿔
        주는 무료 서비스예요. 링크만 붙여넣으면 페이지의 제목·설명·대표 이미지를
        자동으로 읽어와 카드 미리보기를 만들고, 카카오톡이나 SNS에 올렸을 때 한눈에
        들어오는 이미지와 짧은 링크를 만들어 드려요. 네이버 카페 게시글, 인스타그램
        릴처럼 미리보기가 잘 안 잡히는 링크도 문제없어요.
      </Text>

      <Text style={[styles.title, styles.mt24]}>이렇게 동작해요</Text>
      <Text style={styles.step}>1. 공유할 URL을 붙여넣어요. 붙여넣기만 하면 끝이에요.</Text>
      <Text style={styles.step}>
        2. 제목·설명·대표 이미지를 자동으로 읽어와 카드를 완성해요.
      </Text>
      <Text style={styles.step}>
        3. 로그인하면 짧은 공유 링크까지 — 어디에 올려도 예쁜 카드로 떠요.
      </Text>

      <View style={styles.branchBrand}>
        <Text style={styles.branchTitleBrand}>로그인 하면</Text>
        <Text style={styles.branchItem}>
          · <Text style={styles.boldBrand}>짧은 공유 링크</Text>로 카카오톡·SNS에
          바로 보낼 수 있어요.
        </Text>
        <Text style={styles.branchItem}>· 공유한 링크가 클릭을 부르는 미리보기 카드로 떠요.</Text>
        <Text style={styles.branchItem}>
          · 클립이 계정에 쌓여 <Text style={styles.boldBrand}>어느 기기에서나</Text>{" "}
          그대로 보이고, 태그로 깔끔하게 정리돼요.
        </Text>
      </View>

      <View style={styles.branchNeutral}>
        <Text style={styles.branchTitle}>로그인 안 해도</Text>
        <Text style={styles.branchItem}>
          · URL을 붙여넣어 미리보기 카드를 바로 만들 수 있어요.
        </Text>
        <Text style={styles.branchItem}>
          · 만든 클립을 이 기기에 저장하고 ‘내 클립’에서 다시 봐요.
        </Text>
        <Text style={styles.branchItem}>
          · 단, 저장은 <Text style={styles.boldFg}>이 기기에만</Text> 남고{" "}
          <Text style={styles.boldFg}>짧은 공유 링크는 못 만들어요.</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  brand: { marginBottom: 16 },
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
