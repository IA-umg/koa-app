import FormLogin from "@/components/FormLogin/FormLogin";
import PageLoader from "@/components/PageLoader/PageLoader";

export default function Home() {
  return (
    <PageLoader >
      <FormLogin/>
    </PageLoader>
  );
}
