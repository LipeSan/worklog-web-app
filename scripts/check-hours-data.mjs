import { query } from '../src/lib/database.js';

async function checkHoursData() {
  try {
    console.log('🔍 Verificando dados na tabela work_hours...\n');
    
    // Verificar se há dados
    const countResult = await query('SELECT COUNT(*) as total FROM work_hours');
    console.log(`📊 Total de registros: ${countResult.rows[0].total}`);
    
    if (countResult.rows[0].total > 0) {
      // Verificar datas dos dados
      const dateResult = await query(`
        SELECT 
          MIN(work_date) as primeira_data,
          MAX(work_date) as ultima_data,
          COUNT(*) as total
        FROM work_hours
      `);
      
      console.log(`📅 Primeira data: ${dateResult.rows[0].primeira_data}`);
      console.log(`📅 Última data: ${dateResult.rows[0].ultima_data}`);
      
      // Mostrar alguns registros
      const sampleResult = await query(`
        SELECT work_date, project_name, total_hours, total_amount
        FROM work_hours 
        ORDER BY work_date DESC 
        LIMIT 5
      `);
      
      console.log('\n📋 Últimos 5 registros:');
      sampleResult.rows.forEach(row => {
        console.log(`  ${row.work_date} | ${row.project_name} | ${row.total_hours}h | $ ${row.total_amount}`);
      });
    } else {
      console.log('❌ Nenhum registro encontrado na tabela work_hours');
    }
    
    // Verificar data atual
    console.log(`\n🗓️  Data atual: ${new Date().toISOString().split('T')[0]}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  }
}

checkHoursData();