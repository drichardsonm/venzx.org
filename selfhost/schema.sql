-- VENZX — esquema completo para Supabase autoalojado (ejecutar una vez en el SQL editor de Studio o con psql)
-- Privacidad: RLS activado sin políticas públicas; solo service_role (servidor) puede leer/escribir.

create table if not exists public.usuarios (
  id_correlativo serial primary key,
  secreto_hash text unique not null,
  genero text,
  edad_rango text,
  estado text,
  municipio text,
  parroquia text,
  intereses text[] not null default '{}',
  fecha_registro timestamptz not null default now()
);

create table if not exists public.propuestas (
  id_propuesta serial primary key,
  id_usuario int not null references public.usuarios(id_correlativo) on delete cascade,
  tipo_intencion text not null check (tipo_intencion in ('Quiero','Me gusta','No me gusta')),
  contenido text not null,
  categoria text not null default 'General',
  estado_propuesta text not null default 'Revision',
  fecha_creacion timestamptz not null default now()
);

create table if not exists public.apoyos_propuestas (
  id_apoyo serial primary key,
  id_usuario int not null references public.usuarios(id_correlativo) on delete cascade,
  id_propuesta int not null references public.propuestas(id_propuesta) on delete cascade,
  voto_tipo text not null check (voto_tipo in ('Apoyar','Discrepar')),
  unique (id_usuario, id_propuesta)
);

create table if not exists public.propuesta_actividad (
  id bigint generated always as identity primary key,
  id_propuesta int not null references public.propuestas(id_propuesta) on delete cascade,
  id_usuario int not null references public.usuarios(id_correlativo) on delete cascade,
  voto_tipo text not null check (voto_tipo in ('Apoyar','Discrepar')),
  cambio_apoyos smallint not null check (cambio_apoyos in (-1,0,1)),
  fecha_interaccion timestamptz
);
create index if not exists propuesta_actividad_prop_idx on public.propuesta_actividad (id_propuesta, fecha_interaccion);

create table if not exists public.votaciones_convocadas (
  id_votacion serial primary key,
  titulo text not null,
  descripcion text,
  alcance_geografico text not null default 'Nacional',
  estado_restriccion text,
  municipio_restriccion text,
  fecha_inicio timestamptz not null default now(),
  fecha_fin timestamptz not null,
  activa boolean not null default true
);

create table if not exists public.votos_finales (
  id_voto serial primary key,
  id_votacion int not null references public.votaciones_convocadas(id_votacion) on delete cascade,
  id_usuario int not null references public.usuarios(id_correlativo) on delete cascade,
  opcion_seleccionada text not null,
  unique (id_usuario, id_votacion)
);

-- Historial de reacciones (cambios de preferencia; ignora repeticiones idénticas)
create or replace function public.record_propuesta_actividad()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.propuesta_actividad (id_propuesta, id_usuario, voto_tipo, cambio_apoyos, fecha_interaccion)
    values (new.id_propuesta, new.id_usuario, new.voto_tipo,
            case when new.voto_tipo = 'Apoyar' then 1 else 0 end, clock_timestamp());
  elsif tg_op = 'UPDATE' and new.voto_tipo is distinct from old.voto_tipo then
    insert into public.propuesta_actividad (id_propuesta, id_usuario, voto_tipo, cambio_apoyos, fecha_interaccion)
    values (new.id_propuesta, new.id_usuario, new.voto_tipo,
            case when new.voto_tipo = 'Apoyar' then 1 else -1 end, clock_timestamp());
  end if;
  return new;
end $$;

drop trigger if exists trg_record_propuesta_actividad on public.apoyos_propuestas;
create trigger trg_record_propuesta_actividad
after insert or update on public.apoyos_propuestas
for each row execute function public.record_propuesta_actividad();

-- Seguridad
do $$
declare t text;
begin
  foreach t in array array['usuarios','propuestas','apoyos_propuestas','propuesta_actividad','votaciones_convocadas','votos_finales'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;
grant usage, select on all sequences in schema public to service_role;
revoke execute on function public.record_propuesta_actividad() from public, anon, authenticated;

-- Votaciones de ejemplo (opcional; borra este bloque si no las quieres)
insert into public.votaciones_convocadas (titulo, descripcion, alcance_geografico, estado_restriccion, municipio_restriccion, fecha_inicio, fecha_fin, activa)
select * from (values
  ('Prioridad nacional: ¿salud o electricidad?', 'Consulta nacional sobre la prioridad de inversión del próximo año.', 'Nacional', null, null, now(), now() + interval '30 days', true),
  ('Mejorar el transporte público en Zulia', 'Consulta regional para habitantes del estado Zulia.', 'Regional', 'Zulia', null, now(), now() + interval '20 days', true),
  ('Consulta concluida: horario de bibliotecas', 'Consulta finalizada, disponible para auditoría pública.', 'Nacional', null, null, now() - interval '40 days', now() - interval '10 days', false)
) v
where not exists (select 1 from public.votaciones_convocadas);
