
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, weight, height, goal, xp, level, streak_days)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    75, 175, 'hypertrophy', 2450, 12, 7
  );

  INSERT INTO public.health_metrics (user_id, metric_type, value, unit, logged_at) VALUES
    (NEW.id, 'heart_rate', 62, 'bpm', now() - interval '6 days'),
    (NEW.id, 'heart_rate', 65, 'bpm', now() - interval '5 days'),
    (NEW.id, 'heart_rate', 58, 'bpm', now() - interval '4 days'),
    (NEW.id, 'heart_rate', 63, 'bpm', now() - interval '3 days'),
    (NEW.id, 'heart_rate', 60, 'bpm', now() - interval '2 days'),
    (NEW.id, 'heart_rate', 61, 'bpm', now() - interval '1 day'),
    (NEW.id, 'heart_rate', 62, 'bpm', now()),
    (NEW.id, 'glucose', 92, 'mg/dL', now() - interval '6 days'),
    (NEW.id, 'glucose', 98, 'mg/dL', now() - interval '5 days'),
    (NEW.id, 'glucose', 88, 'mg/dL', now() - interval '4 days'),
    (NEW.id, 'glucose', 95, 'mg/dL', now() - interval '3 days'),
    (NEW.id, 'glucose', 90, 'mg/dL', now() - interval '2 days'),
    (NEW.id, 'glucose', 93, 'mg/dL', now() - interval '1 day'),
    (NEW.id, 'glucose', 95, 'mg/dL', now()),
    (NEW.id, 'sleep', 7.5, 'horas', now() - interval '6 days'),
    (NEW.id, 'sleep', 6.8, 'horas', now() - interval '5 days'),
    (NEW.id, 'sleep', 8.0, 'horas', now() - interval '4 days'),
    (NEW.id, 'sleep', 7.2, 'horas', now() - interval '3 days'),
    (NEW.id, 'sleep', 6.5, 'horas', now() - interval '2 days'),
    (NEW.id, 'sleep', 7.8, 'horas', now() - interval '1 day'),
    (NEW.id, 'sleep', 7.0, 'horas', now()),
    (NEW.id, 'hydration', 1.8, 'litros', now() - interval '6 days'),
    (NEW.id, 'hydration', 2.2, 'litros', now() - interval '5 days'),
    (NEW.id, 'hydration', 1.5, 'litros', now() - interval '4 days'),
    (NEW.id, 'hydration', 2.0, 'litros', now() - interval '3 days'),
    (NEW.id, 'hydration', 2.5, 'litros', now() - interval '2 days'),
    (NEW.id, 'hydration', 1.9, 'litros', now() - interval '1 day'),
    (NEW.id, 'hydration', 2.1, 'litros', now()),
    (NEW.id, 'spo2', 98, '%', now() - interval '2 days'),
    (NEW.id, 'spo2', 97, '%', now() - interval '1 day'),
    (NEW.id, 'spo2', 98, '%', now());

  INSERT INTO public.workout_logs (user_id, category, modality, exercise_name, sets, reps, weight_kg, duration_min, xp_earned, logged_at) VALUES
    (NEW.id, 'Musculação', 'Musculação', 'Supino Reto', 4, 10, 80, 45, 15, now() - interval '5 days'),
    (NEW.id, 'Musculação', 'Musculação', 'Agachamento', 4, 8, 100, 50, 15, now() - interval '4 days'),
    (NEW.id, 'Lutas', 'Jiu-Jitsu', 'Treino de guarda', 0, 0, 0, 60, 20, now() - interval '3 days'),
    (NEW.id, 'Cardio', 'Corrida', 'Corrida Matinal', 0, 0, 0, 30, 10, now() - interval '2 days'),
    (NEW.id, 'Musculação', 'Musculação', 'Levantamento Terra', 5, 5, 120, 55, 15, now() - interval '1 day');

  INSERT INTO public.meal_logs (user_id, meal_type, food_name, calories, protein, carbs, fat, logged_at) VALUES
    (NEW.id, 'Café da Manhã', 'Ovos + aveia', 420, 30, 45, 15, now() - interval '1 day'),
    (NEW.id, 'Almoço', 'Frango + arroz + salada', 680, 45, 70, 18, now() - interval '1 day'),
    (NEW.id, 'Jantar', 'Salmão + batata doce', 550, 40, 50, 20, now() - interval '1 day'),
    (NEW.id, 'Café da Manhã', 'Whey + banana + granola', 380, 35, 40, 8, now()),
    (NEW.id, 'Almoço', 'Carne + arroz integral', 620, 42, 65, 16, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
