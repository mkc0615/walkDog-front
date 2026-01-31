import { Redirect } from "expo-router";

export default function Index() {
  // Always start at public home - auth redirects are handled by layouts
  return <Redirect href="/(public)/home" />;
}
