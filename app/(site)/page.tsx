import Image from "next/image";
import { FolderView } from "@/components/FolderView";
import { Group } from "@/components/Group";
import { HeroName } from "@/components/Motion";
import { Slide } from "@/components/Slide";
import { Socials } from "@/components/Socials";
import { getProfile, getTree } from "@/lib/data";
import { repoFilesFor } from "@/lib/github";
import { contents } from "@/lib/tree";

// Documents: the top folder
export default async function Home() {
  const [profile, tree] = await Promise.all([getProfile(), getTree()]);
  const name = profile?.name ?? "Edijs Zvirgzds";
  const [first, ...rest] = name.split(" ");
  const socials = profile?.socials ?? {};
  const items = contents(tree, null);
  const repos = await repoFilesFor(items.flatMap((i) => (i.kind === "project" ? [i] : [])));

  return (
    <Slide>
      <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        <header className="flex flex-col gap-5 py-10 sm:flex-row sm:items-center sm:gap-7">
          {profile?.avatar_url && (
            <Image src={profile.avatar_url} alt={name} width={112} height={112} priority className="size-24 rounded-full object-cover sm:size-28" />
          )}
          <div className="flex flex-col gap-3">
            <HeroName first={first} rest={rest.join(" ")} />
            {profile?.headline && <p className="max-w-xl text-text-dim">{profile.headline}</p>}
            <div className="flex flex-wrap gap-2">
              <Socials socials={socials} />
              {profile?.cv_url && (
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                  Download CV
                </a>
              )}
            </div>
          </div>
        </header>

        <Group id="documents" title="Documents">
          <FolderView tree={tree} items={items} repos={repos} empty="Nothing here yet." />
        </Group>

        <Group id="contact" title="Contact">
          {socials.email ? (
            <p className="text-text-dim">
              Write to{" "}
              <a href={`mailto:${socials.email}`} className="text-accent underline-offset-4 hover:underline">
                {socials.email}
              </a>
            </p>
          ) : (
            <p className="text-text-dim">Find me through the links at the top of this page.</p>
          )}
        </Group>
      </div>
    </Slide>
  );
}
