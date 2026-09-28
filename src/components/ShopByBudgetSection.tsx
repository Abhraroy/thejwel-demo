import Link from "next/link";
import HomeSectionHeading from "@/components/HomePageComponents/HomeSectionHeading";
import { BUDGET_RANGES, budgetListingHref, type BudgetRangeConfig } from "@/lib/budget-ranges";

function BudgetRangeCard({
  range,
}: {
  range: BudgetRangeConfig;
}) {
  return (
    <Link
      href={range.href ?? budgetListingHref(range.id)}
      scroll
      className="group relative block w-[80%] aspect-square justify-self-center self-center overflow-hidden border-4 border-[#393939] bg-transparent"
    >
      <div className="relative z-10 px-2 py-3 sm:py-3.5 h-full flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5">
        <p className="flex items-center justify-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl font-semibold text-black uppercase tracking-wide font-josefin-sans">
          <span>{range.tagline[0]}</span>
          <span>{range.tagline[1]}</span>
        </p>
        <p className="text-4xl sm:text-3xl md:text-4xl lg:text-[3.5rem] font-bold text-black leading-none font-open-sans max-w-full">
          {range.priceDisplay}
        </p>
      </div>
    </Link>
  );
}

export default function ShopByBudgetSection() {
  return (
    <section className="w-full bg-transparent py-3 md:py-4 lg:py-5">
      <HomeSectionHeading
        title="Sparkle Without the Splurge"
        subtitle="Gorgeous picks at every price — tap your range and shine."
        animated
        className="px-3 sm:px-4 lg:px-6 mb-3 md:mb-4"
      />
      <div className="relative w-full max-w-full overflow-hidden px-3 sm:px-4 lg:px-6 bg-transparent">
        <div className="w-[92%] sm:w-[80%] md:w-[60%] lg:w-[30%] aspect-square mx-auto grid grid-cols-2 grid-rows-2 items-center">
          {BUDGET_RANGES.map((range) => (
            <BudgetRangeCard key={range.id} range={range} />
          ))}
        </div>
      </div>
    </section>
  );
}
