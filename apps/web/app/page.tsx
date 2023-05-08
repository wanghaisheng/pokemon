import { db, pokemonTable, pokemonTypesTable, typesTable } from "@pokemon/db";
import { PokemonType, PokemonTypesComboBox, Search } from "@pokemon/ui";
import { InferModel, eq, placeholder, sql } from "drizzle-orm";
import { ChevronRightIcon, SearchIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Pokemon = InferModel<typeof pokemonTable>;
type Type = InferModel<typeof typesTable>;

export default async function Page({ searchParams }: { searchParams: { search?: string } }) {
  const search = searchParams.search;

  const types = db.select().from(typesTable).all();

  let pokemonList: { pokemon: Pokemon; type: Type | null }[];

  // TODO: figure out better where to do conditional .where()
  if (search) {
    pokemonList = db
      .select({
        pokemon: pokemonTable,
        type: typesTable,
      })
      .from(pokemonTable)
      .leftJoin(pokemonTypesTable, eq(pokemonTypesTable.pokemonId, pokemonTable.id))
      .leftJoin(typesTable, eq(pokemonTypesTable.typeId, typesTable.id))
      .where(sql`lower(${pokemonTable.name}) like ${placeholder("name")}`)
      .prepare()
      .all({ name: `%${search}%` });
  } else {
    pokemonList = db
      .select({
        pokemon: pokemonTable,
        type: typesTable,
      })
      .from(pokemonTable)
      .leftJoin(pokemonTypesTable, eq(pokemonTypesTable.pokemonId, pokemonTable.id))
      .leftJoin(typesTable, eq(pokemonTypesTable.typeId, typesTable.id))
      .all();
  }

  const reducedPokemonList = pokemonList.reduce<Record<number, { pokemon: Pokemon; types: Type[] }>>(
    (accumulator, row) => {
      const pokemon = row.pokemon;
      const type = row.type;

      if (!accumulator[pokemon.id]) {
        accumulator[pokemon.id] = { pokemon, types: [] };
      }

      if (type) {
        accumulator[pokemon.id].types.push(type);
      }

      return accumulator;
    },
    {},
  );

  const pokemon = Object.values(reducedPokemonList);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Search defaultValue={search} />
        <PokemonTypesComboBox types={types} />
      </div>
      <ul
        role="list"
        className="divide-gray-3 dark:bg-gray-2 ring-gray-3 h-full max-h-full divide-y overflow-auto bg-white shadow-sm ring-1 sm:rounded-xl"
      >
        {pokemon.length > 0 ? (
          pokemon.map(({ pokemon, types }) => {
            return (
              <li
                key={pokemon.id}
                className="hover:bg-gray-2 dark:hover:bg-gray-3 relative flex justify-between gap-x-6 px-4 py-5 sm:px-6"
              >
                <div className="flex gap-x-4">
                  <Image
                    className="bg-gray-2 dark:bg-gray-4 h-12 w-12 flex-none rounded-full"
                    src={pokemon.sprite}
                    height={48}
                    width={48}
                    alt=""
                  />
                  <div className="min-w-0 flex-auto">
                    <p className="text-slate-12 text-sm font-semibold capitalize leading-6">
                      <Link href={`/pokemon/${pokemon.id}`}>
                        <span className="absolute inset-x-0 -top-px bottom-0" />
                        {pokemon.name}
                      </Link>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-2">
                      {types.map((type) => {
                        return <PokemonType key={type.id} type={type} />;
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-x-4">
                  <ChevronRightIcon className="text-slate-11 h-5 w-5 flex-none" aria-hidden="true" />
                </div>
              </li>
            );
          })
        ) : (
          <li className="flex h-full flex-col items-center justify-center">
            <SearchIcon className="text-gray-11 mx-auto h-12 w-12" aria-hidden="true" />
            <h3 className="text-gray-12 mt-2 text-sm font-semibold">No Pokémon</h3>
          </li>
        )}
      </ul>
    </>
  );
}
