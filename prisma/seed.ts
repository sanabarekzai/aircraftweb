import { PrismaClient, type Category, type Era } from '@prisma/client';
import existingAircraft from '../data/seed-aircraft.json';
import newAircraft from '../data/new-aircraft.json';

const aircraftData = process.argv.includes('--new-only')
  ? newAircraft
  : [...existingAircraft, ...newAircraft];

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
        category: aircraft.category as Category,
        era: aircraft.era as Era,
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
        category: aircraft.category as Category,
        era: aircraft.era as Era,
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

    if (aircraft.slug === 'phantom-3500') {
      const obsoleteTags = await prisma.tag.findMany({
        where: { name: { in: ['Concept', 'Supersonic', 'Experimental'] } },
        select: { id: true },
      });
      await prisma.aircraft.update({
        where: { id: createdAircraft.id },
        data: { tags: { disconnect: obsoleteTags } },
      });
    }

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

    // Never let placeholder rows replace the usable gallery photos.
    const usableImages = aircraft.images.filter((image) => !image.url.startsWith('TODO_VERIFY_'));
    await prisma.aircraftImage.deleteMany({
      where: { aircraftId: createdAircraft.id, url: { startsWith: 'TODO_VERIFY_' } },
    });
    // Seed images using upsert with unique constraint on (aircraftId, url)
    for (const image of usableImages) {
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
