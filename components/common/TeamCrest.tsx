import { useState } from "react";
import { View, Text, Image } from "react-native";
import { SvgUri } from "react-native-svg";
import type { TeamSnapshot } from "../../types/match.types";

interface Props {
  team: TeamSnapshot;
  size?: number;
  // Khi true: bọc logo trong 1 khung tròn nền trắng có viền, logo được
  // inset nhỏ hơn khung (dùng cho các chỗ hiển thị to như trang chi tiết
  // trận đấu / đội bóng). Khi false (mặc định): hiển thị logo full kích
  // thước, dùng cho các chỗ nhỏ như MatchCard.
  bordered?: boolean;
}

// football-data.org trả logo đội bóng ở CẢ 2 định dạng tùy đội: một số
// PNG/JPG (Image hiển thị bình thường), một số khác là .svg — mà
// React Native's <Image> KHÔNG hỗ trợ giải mã SVG (giới hạn của nền tảng,
// không phải bug), nên những đội có logo .svg trước đây bị hiện trống.
//
// Component này tự nhận diện .svg để dùng react-native-svg (SvgUri) thay
// vì <Image>, và có fallback hiện chữ viết tắt tên đội (vd "MU") nếu ảnh
// lỗi vì bất kỳ lý do gì (URL hỏng, mất mạng, định dạng lạ...).
export function TeamCrest({ team, size = 24, bordered = false }: Props) {
  const [failed, setFailed] = useState(false);
  const crest = team.crest?.trim();
  const isSvg = crest?.toLowerCase().split("?")[0].endsWith(".svg");
  const innerSize = bordered ? size * 0.7 : size;

  const fallback = (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e7e9ee",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: Math.max(9, size * 0.36), fontWeight: "700", color: "#94a3b8" }}>
        {team.tla?.slice(0, 2) || "?"}
      </Text>
    </View>
  );

  if (!crest || failed) return fallback;

  const image = isSvg ? (
    <SvgUri width={innerSize} height={innerSize} uri={crest} onError={() => setFailed(true)} />
  ) : (
    <Image
      source={{ uri: crest }}
      style={{ width: innerSize, height: innerSize }}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );

  if (!bordered) return <View style={{ width: size, height: size }}>{image}</View>;

  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: "#ffffff",
        borderWidth: 1, borderColor: "#e7e9ee", alignItems: "center", justifyContent: "center",
      }}
    >
      {image}
    </View>
  );
}
