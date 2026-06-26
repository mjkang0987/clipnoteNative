import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";

const QA: { q: string; a: string }[] = [
  {
    q: "태그는 어떻게 쓰나요?",
    a: "태그 칸에 쉼표(,)로 최대 6개까지 달 수 있어요. ‘내 클립’에서 같은 태그끼리 모아 볼 수 있어요.",
  },
  {
    q: "로그인 없이도 쓸 수 있나요?",
    a: "네. 비로그인 상태에서도 URL을 이 기기에 저장할 수 있어요. 다만 공유 링크 생성은 로그인(Google·Kakao)이 필요합니다.",
  },
  {
    q: "네이버 카페·인스타그램 링크도 되나요?",
    a: "네. 전용 추출로 네이버 카페 게시글 제목, 인스타그램 릴·게시물 정보까지 가져와요. (비공개·멤버 전용 글은 제한될 수 있어요.)",
  },
  {
    q: "공유 링크를 열면 어떻게 되나요?",
    a: "클릭하면 예쁜 미리보기 카드가 잠깐 보였다가, 원본 페이지로 자연스럽게 넘어가요.",
  },
  { q: "무료인가요?", a: "네, 무료로 사용할 수 있어요." },
];

export default function Faq() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {QA.map((item) => (
        <View key={item.q} style={styles.block}>
          <Text style={styles.q}>{item.q}</Text>
          <Text style={styles.a}>{item.a}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  block: { marginBottom: 18 },
  q: { fontSize: 15, fontWeight: "600", color: colors.fg },
  a: { marginTop: 6, fontSize: 14, lineHeight: 22, color: colors.fgMuted },
});
