import { PrismaClient } from '@prisma/client';
import aircraftData from '../data/seed-aircraft.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Seed tags first using connectOrCreate
  const allTags = new Set<string>();
  aircraftData.forEach((aircraft) => {
    aircraft.tags.forEach((tag) => allTags.add(tag));
  });

  for (const tagName of allTags) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
  }

  console.log(`Seeded ${allTags.size} tags`);

  // Seed aircraft with images and tags
  for (const aircraft of aircraftData) {
    // Create or update aircraft
    const createdAircraft = await prisma.aircraft.upsert({
      where: { slug: aircraft.slug },
      update: {
        name: aircraft.name,
        isConcept: aircraft.isConcept,
        category: aircraft.category as any,
        era: aircraft.era as any,
        releaseYear: aircraft.releaseYear,
        topSpeedKmh: aircraft.topSpeedKmh,
        serviceCeilingFt: aircraft.serviceCeilingFt,
        maxRangeNm: aircraft.maxRangeNm,
        wingspanM: aircraft.wingspanM,
        maxTakeoffWeightLbs: aircraft.maxTakeoffWeightLbs,
        stallSpeedKts: aircraft.stallSpeedKts,
        liftToDragRatio: aircraft.liftToDragRatio,
        engineType: aircraft.engineType,
        description: aircraft.description,
        flightControlsDescription: aircraft.flightControlsDescription,
        youtubeId: aircraft.youtubeId,
        schematicUrl: aircraft.schematicUrl,
      },
      create: {
        slug: aircraft.slug,
        name: aircraft.name,
        isConcept: aircraft.isConcept,
        category: aircraft.category as any,
        era: aircraft.era as any,
        releaseYear: aircraft.releaseYear,
        topSpeedKmh: aircraft.topSpeedKmh,
        serviceCeilingFt: aircraft.serviceCeilingFt,
        maxRangeNm: aircraft.maxRangeNm,
        wingspanM: aircraft.wingspanM,
        maxTakeoffWeightLbs: aircraft.maxTakeoffWeightLbs,
        stallSpeedKts: aircraft.stallSpeedKts,
        liftToDragRatio: aircraft.liftToDragRatio,
        engineType: aircraft.engineType,
        description: aircraft.description,
        flightControlsDescription: aircraft.flightControlsDescription,
        youtubeId: aircraft.youtubeId,
        schematicUrl: aircraft.schematicUrl,
      },
    });

    // Seed tags for this aircraft
    for (const tagName of aircraft.tags) {
      const tag = await prisma.tag.findUnique({ where: { name: tagName } });
      if (tag) {
        await prisma.aircraft.update({
          where: { id: createdAircraft.id },
          data: { tags: { connect: { id: tag.id } } },
        });
      }
    }

    // Seed images using upsert with unique constraint on (aircraftId, url)
    for (const image of aircraft.images) {
      await prisma.aircraftImage.upsert({
        where: {
          aircraftId_url: {
            aircraftId: createdAircraft.id,
            url: image.url,
          },
        },
        update: {
          caption: image.caption,
          source: image.source,
          license: image.license,
        },
        create: {
          aircraftId: createdAircraft.id,
          url: image.url,
          caption: image.caption,
          source: image.source,
          license: image.license,
        },
      });
    }

    console.log(`Seeded aircraft: ${aircraft.name}`);
  }

  // Verify count
  const aircraftCount = await prisma.aircraft.count();
  const tagCount = await prisma.tag.count();
  const imageCount = await prisma.aircraftImage.count();

  console.log(`\nSeed complete!`);
  console.log(`- Aircraft: ${aircraftCount}`);
  console.log(`- Tags: ${tagCount}`);
  console.log(`- Images: ${imageCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
