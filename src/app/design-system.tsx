import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Avatar,
  AvatarStack,
  Btn,
  Card,
  Label,
  NavBar,
  Pill,
  ScreenTitle,
} from "@/components";
import { colors, fonts, spacing } from "@/theme/tokens";

// Visual smoke-test for every atom in every variant. Lives at
// /design-system. Delete or hide behind a dev flag once real screens
// are using all the atoms in production.
export default function DesignSystemScreen() {
  return (
    <View style={styles.root}>
      <NavBar
        title="Design System"
        leading="back"
        onLeadingPress={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle sub="every atom, every variant">
          Midnight Garden
        </ScreenTitle>

        <Section title="Label">
          <Row>
            <Label>Default</Label>
            <Label tone="brass">Brass</Label>
            <Label tone="claret">Claret</Label>
            <Label tone="fern">Fern</Label>
          </Row>
        </Section>

        <Section title="Pill">
          <Row>
            <Pill>Default</Pill>
            <Pill tone="brass">Brass</Pill>
            <Pill tone="claret">Claret</Pill>
            <Pill tone="fern">Fern</Pill>
          </Row>
          <Row>
            <Pill dashed>+ Filter</Pill>
            <Pill tone="brass" dashed>+ Add</Pill>
          </Row>
        </Section>

        <Section title="Avatar">
          <Row>
            <Avatar initial="N" size={22} />
            <Avatar initial="N" size={40} />
            <Avatar initial="N" size={56} />
          </Row>
          <Row>
            <Avatar initial="A" size={40} accent="default" />
            <Avatar initial="B" size={40} accent="brass" />
            <Avatar initial="C" size={40} accent="claret" />
          </Row>
        </Section>

        <Section title="AvatarStack">
          <Row>
            <AvatarStack initials={["A"]} />
            <AvatarStack initials={["A", "B"]} />
            <AvatarStack initials={["A", "B", "C"]} />
            <AvatarStack initials={["A", "B", "C", "D", "E"]} />
          </Row>
        </Section>

        <Section title="Card">
          <Card>
            <Text style={styles.bodyText}>
              Default tone — used for most content cards.
            </Text>
          </Card>
          <View style={{ height: spacing.md }} />
          <Card tone="nested">
            <Text style={styles.bodyText}>
              Nested tone — for cards that sit inside another card.
            </Text>
          </Card>
        </Section>

        <Section title="Btn">
          <View style={{ gap: spacing.md }}>
            <Btn tone="primary">Primary</Btn>
            <Btn>Default</Btn>
            <Btn tone="primary" full>
              Primary, full width
            </Btn>
            <Btn full>Default, full width</Btn>
          </View>
        </Section>

        <Section title="ScreenTitle">
          <Card>
            <ScreenTitle sub="this is the subtitle slot">
              Title goes here
            </ScreenTitle>
          </Card>
        </Section>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Label tone="brass" style={styles.sectionLabel}>
        {title}
      </Label>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  sectionBody: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    alignItems: "center",
  },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text2,
    lineHeight: 22,
  },
});
